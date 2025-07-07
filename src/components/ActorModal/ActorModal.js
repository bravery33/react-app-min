import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './ActorModal.css';

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const ActorModal = ({ actorId, apiKey, onClose }) => {
  const [actorDetails, setActorDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!actorId) return;

    const fetchActorDetails = async () => {
      setIsLoading(true);
      try {
        const [detailsRes, creditsRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/person/${actorId}?api_key=${apiKey}&language=ko-KR`),
          fetch(`${TMDB_BASE_URL}/person/${actorId}/movie_credits?api_key=${apiKey}&language=ko-KR`)
        ]);

        const detailsData = await detailsRes.json();
        const creditsData = await creditsRes.json();

        setActorDetails({ ...detailsData, movie_credits: creditsData.cast });
      } catch (error) {
        console.error("Failed to fetch actor details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActorDetails();
  }, [actorId, apiKey]);
  
  const handleOverlayClick = (e) => {
    if (e.target.id === "modal-overlay") {
      onClose();
    }
  };

  return (
    <div id="modal-overlay" className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button onClick={onClose} className="modal-close-button">&times;</button>
        {isLoading ? <LoadingSpinner /> : (
          actorDetails && (
            <>
              <div className="actor-profile">
                <img 
                  src={actorDetails.profile_path ? `https://image.tmdb.org/t/p/w185${actorDetails.profile_path}` : "https://placehold.co/185x278/1f2937/9ca3af?text=No+Image"} 
                  alt={actorDetails.name}
                  className="actor-profile-image"
                />
                <div className="actor-profile-info">
                  <h2 className="text-3xl font-bold">{actorDetails.name}</h2>
                  <p className="text-sm text-gray-400">생년월일: {actorDetails.birthday || '정보 없음'}</p>
                  <p className="actor-biography">{actorDetails.biography || '소개 정보가 없습니다.'}</p>
                </div>
              </div>

              <div className="actor-filmography">
                <h3 className="text-xl font-bold mt-6 mb-3">주요 출연작</h3>
                <div className="filmography-list">
                  {actorDetails.movie_credits?.sort((a, b) => b.popularity - a.popularity).slice(0, 10).map(movie => (
                    <div key={movie.credit_id} className="filmography-item">
                      <img 
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : "https://placehold.co/185x278/1f2937/9ca3af?text=No+Image"} 
                        alt={movie.title}
                      />
                      <p className="filmography-title">{movie.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ActorModal;