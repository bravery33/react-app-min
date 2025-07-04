import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './MovieDetail.css';

// apiKey와 baseUrl을 props로 받아옵니다.
const MovieDetail = ({ movie, onBack, apiKey, baseUrl }) => {
  // 여기서 API 키와 URL 선언부를 완전히 삭제합니다.

  const [details, setDetails] = useState({ video: null, credits: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        // props로 받은 apiKey와 baseUrl을 사용합니다.
        const [videoRes, creditsRes] = await Promise.all([
          fetch(`${baseUrl}/movie/${movie.id}/videos?api_key=${apiKey}&language=ko-KR`),
          fetch(`${baseUrl}/movie/${movie.id}/credits?api_key=${apiKey}&language=ko-KR`),
        ]);

        if (!videoRes.ok || !creditsRes.ok) throw new Error("Failed to fetch one or more details");

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
  }, [movie.id, apiKey, baseUrl]); // useEffect의 의존성 배열에 추가해줍니다.

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image";

  return (
    // ... JSX 부분은 이전과 동일합니다 ...
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <button onClick={onBack} className="mb-8 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
        ← 뒤로가기
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <img src={imageUrl} alt={movie.title || movie.movieNm} className="w-full rounded-lg shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image"; }} />
        </div>
        <div className="md:w-2/3">
          <h2 className="text-4xl font-bold mb-2">{movie.title || movie.movieNm}</h2>
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

      {isLoading ? <div className="flex justify-center items-center h-64"><LoadingSpinner /></div> : (
        <>
          {details.video && (
            <div className="my-12">
              <h3 className="text-2xl font-bold mb-4 text-purple-400 border-l-4 border-purple-400 pl-4">예고편</h3>
              <div className="aspect-w-16 aspect-h-9">
                <iframe src={`https://www.youtube.com/embed/${details.video.key}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg"></iframe>
              </div>
            </div>
          )}
          {details.credits?.cast && details.credits.cast.length > 0 && (
            <div className="my-12">
              <h3 className="text-2xl font-bold mb-4 text-purple-400 border-l-4 border-purple-400 pl-4">주요 출연진</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {details.credits.cast.map(actor => (
                  <div key={actor.cast_id} className="text-center">
                    <img src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "https://placehold.co/185x278/1f2937/9ca3af?text=No+Image"} alt={actor.name} className="w-full h-auto rounded-lg mb-2 shadow-md" />
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
  );
};

export default MovieDetail;