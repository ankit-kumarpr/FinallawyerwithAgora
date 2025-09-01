import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear session/local storage
    sessionStorage.clear();
    localStorage.clear();

    // Optionally: call logout API if needed
    // await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });

    // Show logout success toast
    toast.success('You have been logged out successfully!', {
      position: 'top-center',
      autoClose: 1500,
    });

    // Redirect after short delay
    const timer = setTimeout(() => {
      navigate('/'); // Adjust route as needed
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <ToastContainer />
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-muted">Logging out...</p>
      </div>
    </div>
  );
};

export default Logout;
