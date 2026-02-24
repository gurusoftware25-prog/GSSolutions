"""
Production startup script using Waitress WSGI server
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
    _waitress = importlib.import_module('waitress')
    serve = getattr(_waitress, 'serve')
except Exception as e:
    raise RuntimeError("Missing required package 'waitress'. Install with: pip install waitress") from e

# Import the Flask app
from app import app

if __name__ == '__main__':
    print("Starting Guru Software Solutions Backend Server...")
    print("Serving on http://localhost:5000")
    print("Using Waitress WSGI Server (Production-ready)")
    serve(app, host='127.0.0.1', port=5000, _quiet=False)
