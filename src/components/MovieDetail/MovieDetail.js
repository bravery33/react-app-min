import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import ActorModal from '../ActorModal/ActorModal';
import './MovieDetail.css';

const MovieDetail = ({ movie, onBack, apiKey, baseUrl, favorites, onAddFavorite, onRemoveFavorite }) => {
  const [details, setDetails] = useState({
    video: null,
    credits: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActorId, setSelectedActorId] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const [videoRes, creditsRes] = await Promise.all([
          fetch(`${baseUrl}/movie/${movie.id}/videos?api_key=${apiKey}&language=ko-KR`),
          fetch(`${baseUrl}/movie/${movie.id}/credits?api_key=${apiKey}&language=ko-KR`),
        ]);

        if (!videoRes.ok || !creditsRes.ok) {
            throw new Error("Failed to fetch one or more details");
        }

        const videoData = await videoRes.json();
        const creditsData = await creditsRes.json();
        
        const trailer = videoData.results.find(v => v.type === 'Trailer');
        const director = creditsData.crew.find(c => c.job === 'Director');

        setDetails({
          video: trailer,
          credits: { director, cast: creditsData.cast.slice(0, 6) },
        });

      } catch (error) {
        console.error("Failed to fetch movie details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [movie.id, apiKey, baseUrl]);

  const isFavorite = favorites.some((fav) => fav.id === movie.id);

  const handleFavoriteClick = () => {
    if (isFavorite) {
      onRemoveFavorite(movie);
    } else {
      onAddFavorite(movie);
    }
  };

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image";

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
        <button 
          onClick={onBack}
          className="mb-8 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          ← 뒤로가기
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <img src={imageUrl} alt={movie.title || movie.movieNm} className="w-full rounded-lg shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/500x750/1f2937/9ca3af?text=No+Image"; }} />
          </div>
          <div className="md:w-2/3">
            <div className="flex justify-between items-start">
              <h2 className="text-4xl font-bold mb-2 pr-4">{movie.title || movie.movieNm}</h2>
              <button onClick={handleFavoriteClick} className="p-2 rounded-full hover:bg-gray-700 transition flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isFavorite ? 'text-yellow-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </div>
            <p className="text-lg text-gray-400 mb-4">{movie.original_title}</p>
            <div className="flex items-center flex-wrap mb-4 space-x-4">
              <span className="text-yellow-400">★ {movie.vote_average?.toFixed(1) || 'N/A'}</span>
              <span>|</span>
              <span>개봉: {movie.reReleaseDate || movie.release_date || movie.openDt}</span>
              {movie.audiAcc && <span>|</span>}
              {movie.audiAcc && <span>누적 관객: {parseInt(movie.audiAcc).toLocaleString()}명</span>}
            </div>
            <p className="text-gray-300 leading-relaxed mb-8">{movie.overview || "줄거리 정보가 없습니다."}</p>
            {details.credits?.director && (
              <div className="mb-4">
                <span className="font-bold text-gray-400">감독: </span>
                <span>{details.credits.director.name}</span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {details.video && (
              <div className="my-12">
                <h3 className="text-2xl font-bold mb-4 text-purple-400 border-l-4 border-purple-400 pl-4">예고편</h3>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={`https://www.youtube.com/embed/${details.video.key}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  ></iframe>
                </div>
              </div>
            )}

            {details.credits?.cast && details.credits.cast.length > 0 && (
              <div className="my-12">
                <h3 className="text-2xl font-bold mb-4 text-purple-400 border-l-4 border-purple-400 pl-4">주요 출연진</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {details.credits.cast.map(actor => (
                    <div key={actor.cast_id} className="text-center cursor-pointer" onClick={() => setSelectedActorId(actor.id)}>
                      <img 
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "https://placehold.co/185x278/1f2937/9ca3af?text=No+Image"} 
                        alt={actor.name} 
                        className="w-full h-auto rounded-lg mb-2 shadow-md"
                      />
                      <p className="font-bold text-sm">{actor.name}</p>
                      <p className="text-xs text-gray-400">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {selectedActorId && (
        <ActorModal 
          actorId={selectedActorId} 
          apiKey={apiKey} 
          onClose={() => setSelectedActorId(null)} 
        />
      )}
    </>
  );
};

export default MovieDetail;