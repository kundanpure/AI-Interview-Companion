export const authStyles = {
  container: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh', 
    backgroundColor: '#f0f4f8', 
    color: '#333', 
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  logo: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: '1rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
    marginBottom: '2rem'
  },
  title: {
    textAlign: 'center',
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '1.5rem'
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1.25rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontWeight: '500',
    fontSize: '0.9rem',
    color: '#7f8c8d'
  },
  input: { 
    padding: '0.75rem', 
    borderRadius: '4px', 
    border: '1px solid #dcdfe6', 
    fontSize: '1rem',
    transition: 'border-color 0.2s',
    '&:focus': {
      borderColor: '#3498db',
      outline: 'none'
    }
  },
  button: { 
    padding: '0.75rem', 
    borderRadius: '4px', 
    border: 'none', 
    backgroundColor: '#3498db', 
    color: 'white', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
    '&:hover': {
      backgroundColor: '#2980b9'
    },
    '&:disabled': {
      backgroundColor: '#95a5a6',
      cursor: 'not-allowed'
    }
  },
  forgotPassword: {
    textAlign: 'right',
    fontSize: '0.9rem',
    marginTop: '-0.5rem'
  },
  error: { 
    color: '#e74c3c', 
    marginTop: '1rem', 
    textAlign: 'center',
    padding: '0.5rem',
    backgroundColor: '#fceaea',
    borderRadius: '4px',
    fontSize: '0.9rem'
  },
  success: { 
    color: '#27ae60', 
    marginTop: '1rem', 
    textAlign: 'center',
    padding: '0.5rem',
    backgroundColor: '#e8f8f5',
    borderRadius: '4px',
    fontSize: '0.9rem'
  },
  linkContainer: { 
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#7f8c8d'
  },
  link: { 
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: '500',
    '&:hover': {
      textDecoration: 'underline'
    }
  }
};