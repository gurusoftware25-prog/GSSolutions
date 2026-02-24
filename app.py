"""
GURU SOFTWARE SOLUTIONS - FLASK BACKEND
Main application file with API endpoints
"""

import importlib

# Shim for Python versions where pkgutil.get_loader was removed (e.g., Python 3.14)
try:
    import pkgutil
    if not hasattr(pkgutil, 'get_loader'):
        import importlib.util
        def _get_loader(name):
            try:
                spec = importlib.util.find_spec(name)
                return spec.loader if spec is not None else None
            except Exception:
                return None
        pkgutil.get_loader = _get_loader
except Exception:
    pass

# Compatibility shim for AST node classes removed/renamed in newer Python
try:
    import ast
    if not hasattr(ast, 'Str'):
        ast.Str = getattr(ast, 'Constant')
except Exception:
    pass

try:
    _flask = importlib.import_module('flask')
    Flask = getattr(_flask, 'Flask')
    render_template = getattr(_flask, 'render_template')
    request = getattr(_flask, 'request')
    jsonify = getattr(_flask, 'jsonify')
    send_from_directory = getattr(_flask, 'send_from_directory')
except Exception as e:
    raise RuntimeError("Missing required package 'Flask'. Install dependencies with: pip install -r ../requirements.txt") from e

try:
    _flask_cors = importlib.import_module('flask_cors')
    CORS = getattr(_flask_cors, 'CORS')
except Exception as e:
    raise RuntimeError("Missing required package 'Flask-CORS'. Install dependencies with: pip install -r ../requirements.txt") from e
import sqlite3
import os
from datetime import datetime
try:
    _werkzeug = importlib.import_module('werkzeug.utils')
    secure_filename = getattr(_werkzeug, 'secure_filename')
except Exception as e:
    raise RuntimeError("Missing required package 'Werkzeug'. Install dependencies with: pip install -r ../requirements.txt") from e
import json

# Initialize Flask app (disable default static handling to avoid AST/werkzeug issues on some Python versions)
app = Flask(__name__, static_folder=None)

CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

# ==================== DATABASE SETUP ====================
def get_db():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(BASE_DIR, 'guru_software.db')
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize database tables"""
    db = get_db()
    cursor = db.cursor()
    
    # Contact submissions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'new'
        )
    ''')
    
    # Job applications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            experience TEXT NOT NULL,
            message TEXT,
            resume_filename TEXT,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'new'
        )
    ''')
    
    db.commit()
    db.close()

# Initialize database on app startup
init_db()

# ==================== STATIC FILES ==================== 

@app.route('/')
def index():
    """Serve the main index.html"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/admin')
def admin():
    """Serve the admin dashboard"""
    return send_from_directory('.', 'admin.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('../frontend', filename)

# ==================== API ENDPOINTS ==================== 

@app.route('/api/contact', methods=['POST'])
def handle_contact_form():
    """
    Handle contact form submissions
    POST data: name, email, phone, subject, message
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        # Validate email format
        if not is_valid_email(data['email']):
            return jsonify({
                'success': False,
                'error': 'Invalid email format'
            }), 400
        
        # Save to database
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            INSERT INTO contact_submissions 
            (name, email, phone, subject, message, status)
            VALUES (?, ?, ?, ?, ?, 'new')
        ''', (
            data['name'],
            data['email'],
            data.get('phone', ''),
            data['subject'],
            data['message']
        ))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Contact form submitted successfully'
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/apply-job', methods=['POST'])
def handle_job_application():
    """
    Handle job application submissions
    POST data: role, name, email, phone, experience, message
    """
    try:
        # Support both JSON and multipart/form-data (with resume upload)
        resume_filename = None

        if request.is_json:
            data = request.get_json()
            resume = None
        else:
            data = request.form
            resume = request.files.get('resume')

        # Validate required fields
        required_fields = ['role', 'name', 'email', 'phone', 'experience']
        if not all(field in data and data.get(field) for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400

        # Validate email format
        if not is_valid_email(data.get('email')):
            return jsonify({
                'success': False,
                'error': 'Invalid email format'
            }), 400

        # Validate phone number
        if not is_valid_phone(data.get('phone')):
            return jsonify({
                'success': False,
                'error': 'Invalid phone number'
            }), 400

        # Handle resume upload if provided
        if resume and resume.filename:
            if not allowed_file(resume.filename):
                return jsonify({
                    'success': False,
                    'error': 'Unsupported resume file type'
                }), 400

            filename = secure_filename(resume.filename)
            # Prefix filename with timestamp to avoid collisions
            timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            saved_name = f"{timestamp}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_name)
            resume.save(save_path)
            resume_filename = saved_name

        # Save to database (include resume filename if any)
        db = get_db()
        cursor = db.cursor()

        cursor.execute('''
            INSERT INTO job_applications 
            (role, name, email, phone, experience, message, resume_filename, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
        ''', (
            data.get('role'),
            data.get('name'),
            data.get('email'),
            data.get('phone'),
            data.get('experience'),
            data.get('message', ''),
            resume_filename
        ))

        db.commit()
        job_id = cursor.lastrowid
        db.close()

        return jsonify({
            'success': True,
            'message': 'Job application submitted successfully',
            'application_id': job_id
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/contact-submissions', methods=['GET'])
def get_contact_submissions():
    """
    Get all contact submissions (Admin endpoint)
    Returns paginated list of contact form submissions
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        db = get_db()
        cursor = db.cursor()
        
        # Get total count
        cursor.execute('SELECT COUNT(*) as count FROM contact_submissions')
        total = cursor.fetchone()['count']
        
        # Get paginated results
        cursor.execute('''
            SELECT * FROM contact_submissions 
            ORDER BY submitted_at DESC 
            LIMIT ? OFFSET ?
        ''', (per_page, (page - 1) * per_page))
        
        submissions = cursor.fetchall()
        db.close()
        
        return jsonify({
            'success': True,
            'submissions': [dict(row) for row in submissions],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/job-applications', methods=['GET'])
def get_job_applications():
    """
    Get all job applications (Admin endpoint)
    Returns paginated list of job applications
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        db = get_db()
        cursor = db.cursor()
        
        # Get total count
        cursor.execute('SELECT COUNT(*) as count FROM job_applications')
        total = cursor.fetchone()['count']
        
        # Get paginated results
        cursor.execute('''
            SELECT * FROM job_applications 
            ORDER BY applied_at DESC 
            LIMIT ? OFFSET ?
        ''', (per_page, (page - 1) * per_page))
        
        applications = cursor.fetchall()
        db.close()
        
        return jsonify({
            'success': True,
            'applications': [dict(row) for row in applications],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/contact-submission/<int:submission_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_contact_submission(submission_id):
    """
    Manage individual contact submission (Admin endpoint)
    GET: Get submission details
    PUT: Update submission status
    DELETE: Delete submission
    """
    try:
        db = get_db()
        cursor = db.cursor()
        
        if request.method == 'GET':
            cursor.execute('SELECT * FROM contact_submissions WHERE id = ?', (submission_id,))
            submission = cursor.fetchone()
            db.close()
            
            if not submission:
                return jsonify({
                    'success': False,
                    'error': 'Submission not found'
                }), 404
            
            return jsonify({
                'success': True,
                'submission': dict(submission)
            }), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            if 'status' in data:
                cursor.execute(
                    'UPDATE contact_submissions SET status = ? WHERE id = ?',
                    (data['status'], submission_id)
                )
                db.commit()
            
            db.close()
            return jsonify({
                'success': True,
                'message': 'Submission updated'
            }), 200
        
        elif request.method == 'DELETE':
            cursor.execute('DELETE FROM contact_submissions WHERE id = ?', (submission_id,))
            db.commit()
            db.close()
            
            return jsonify({
                'success': True,
                'message': 'Submission deleted'
            }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/job-application/<int:application_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_job_application(application_id):
    """
    Manage individual job application (Admin endpoint)
    GET: Get application details
    PUT: Update application status
    DELETE: Delete application
    """
    try:
        db = get_db()
        cursor = db.cursor()
        
        if request.method == 'GET':
            cursor.execute('SELECT * FROM job_applications WHERE id = ?', (application_id,))
            application = cursor.fetchone()
            db.close()
            
            if not application:
                return jsonify({
                    'success': False,
                    'error': 'Application not found'
                }), 404
            
            return jsonify({
                'success': True,
                'application': dict(application)
            }), 200
        
        elif request.method == 'PUT':
            data = request.get_json()
            if 'status' in data:
                cursor.execute(
                    'UPDATE job_applications SET status = ? WHERE id = ?',
                    (data['status'], application_id)
                )
                db.commit()
            
            db.close()
            return jsonify({
                'success': True,
                'message': 'Application updated'
            }), 200
        
        elif request.method == 'DELETE':
            cursor.execute('DELETE FROM job_applications WHERE id = ?', (application_id,))
            db.commit()
            db.close()
            
            return jsonify({
                'success': True,
                'message': 'Application deleted'
            }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """
    Get overall statistics (Admin endpoint)
    Returns count of submissions and applications
    """
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM contact_submissions')
        contact_count = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM job_applications')
        applications_count = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM contact_submissions WHERE status = "new"')
        new_contacts = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM job_applications WHERE status = "new"')
        new_applications = cursor.fetchone()['count']
        
        db.close()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_contacts': contact_count,
                'total_applications': applications_count,
                'new_contacts': new_contacts,
                'new_applications': new_applications
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== HELPER FUNCTIONS ==================== 

def is_valid_email(email):
    """
    Validate email format
    """
    import re
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def is_valid_phone(phone):
    """
    Validate phone number format
    """
    import re
    # Remove non-digit characters
    digits = re.sub(r'\D', '', phone)
    # Check if at least 10 digits
    return len(digits) >= 10

def allowed_file(filename):
    """
    Check if file extension is allowed
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== ERROR HANDLERS ==================== 

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Resource not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# ==================== RUN APPLICATION ==================== 

if __name__ == '__main__':
    init_db()
    print("Starting Guru Software Solutions Backend Server...")
    print("Serving on http://localhost:5000")
    app.run(debug=False, host='127.0.0.1', port=5000, use_reloader=False)