'use client'
import { useState } from 'react';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const [
    signInWithEmailAndPassword,
    user,
    loading,
    authError
  ] = useSignInWithEmailAndPassword(auth);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await signInWithEmailAndPassword(email, password);
      if (result.user) {
        sessionStorage.setItem('user', 'true');
        setEmail('');
        setPassword('');
        router.push('/');
      }
    } catch (error) {
      let errorMessage = 'Incorrect password, please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-box">
        <h2 className="sign-in-title">Sign In to Your Account</h2>
        <form className="sign-in-form" onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email address"
            className="sign-in-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="sign-in-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="sign-in-button">Sign In</button>
          <p className='signupsignintext'>Don&apos;t have an account?</p>
          <p className="already-account" onClick={() => router.push("/signup")}> Sign Up</p>
        </form>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
      </div>
    </div>
  );
};

export default SignIn;
