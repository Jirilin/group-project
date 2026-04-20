import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-medium">Full Name:</div>
          <div>{user.full_name}</div>
          <div className="font-medium">Email:</div>
          <div>{user.email}</div>
          <div className="font-medium">Designation:</div>
          <div>{user.designation}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;