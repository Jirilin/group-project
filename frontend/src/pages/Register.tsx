import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
  designation: string;
}

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input {...register('full_name', { required: true })} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" {...register('email', { required: true })} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Designation</label>
            <select {...register('designation', { required: true })} className="mt-1 block w-full border rounded-md p-2">
              <option value="">Select</option>
              <option value="student">Student</option>
              <option value="researcher">Researcher</option>
              <option value="doctor">Doctor</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" {...register('password', { required: true, minLength: 6 })} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Register</button>
        </form>
        <div className="text-center">
          <Link to="/login" className="text-blue-600">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;