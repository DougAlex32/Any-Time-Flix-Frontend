import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useRouter } from 'next/router'; // Corrected import from 'next/router'
import { useState, useEffect } from 'react';

import handleLogout from '@/app/utils/handleLogout';
import setAuthToken from '@/app/utils/setAuthToken';

import Profile from './account/Profile';
import UserList from './account/UserList';
import ProfileSidebar from './account/ProfileSidebar';
import style from '../styles/Explore.module.css';

export default function Page({ handleUserData }) {
    const [data, setData] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Added for error handling
    const [activeView, setActiveView] = useState('Profile');

    useEffect(() => {
        const checkSession = () => {
            const expirationTime = new Date(parseInt(localStorage.getItem('expiration')) * 1000);
            if (Date.now() >= expirationTime) {
                handleLogout();
                alert('Session has ended. Please login to continue.');
                router.push('/');
            }
        };

        checkSession();
        setAuthToken(localStorage.getItem('jwtToken'));

        if (localStorage.getItem('jwtToken')) {
            axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/users/email/${localStorage.getItem('email')}`)
                .then((response) => {
                    const userData = jwtDecode(localStorage.getItem('jwtToken'));
                    if (userData.email === localStorage.getItem('email')) {
                        setData(response.data);
                        handleUserData(response.data);
                        setLoading(false);
                    } else {
                        router.push('/users/login');
                    }
                })
                .catch((error) => {
                    console.error('error', error);
                    setError(error);
                    setLoading(false);
                });
        } else {
            router.push('/users/login');
        }
    }, []);

    const handleUpdateList = (listName, removedMovieId) => {
        setData(prevData => ({
            ...prevData,
            userData: {
                ...prevData.userData,
                [listName]: prevData.userData[listName].filter(movie => movie.id !== removedMovieId)
            }
        }));
    };

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error loading data: {error.message}</p>; // Error handling
    if (!data) return <p>No data shown...</p>;

    const renderContent = () => {
        const listMapping = {
            'Watch List': 'watchList',
            'Watched': 'watched',
            'Liked': 'liked'
        };
        const currentListName = listMapping[activeView];

        return currentListName ? (
            <UserList list={data.userData[currentListName]} dataProp={data.userData} listName={currentListName} onUpdateList={(movieId) => handleUpdateList(currentListName, movieId)} />
        ) : (
            <Profile dataProp={data.userData} />
        );
    };

    return (
        <div className={style.container}>
            <div className={style.sidebar}>
                <ProfileSidebar handleMain={setActiveView} dataProp={data.userData} />
            </div>
            <div className={style.main}>
                {renderContent()}
            </div>
        </div>
    );
}
