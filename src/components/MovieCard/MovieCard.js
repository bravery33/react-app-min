import React from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, onMovieSelect, rank, sectionTitle, genres }) => {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image";

  const renderDate = () => {
    if (sectionTitle === "재개봉 예정작") return `재개봉 예정: ${movie.reReleaseDate}`;
    if (sectionTitle === "재개봉 화제작") return `최초 개봉: ${movie.openDt}`;
    return movie.release_date || movie.openDt;
  };

  const RankInfo = () => {
    if (!movie.rankInten) return null;
    const rankInten = parseInt(movie.rankInten);
    if (movie.rankOldAndNew === 'NEW') return <span className="text-xs font-bold text-red-400 ml-2">NEW</span>;
    if (rankInten > 0) return <span className="text-xs text-green-400 ml-2">▲ {rankInten}</span>;
    if (rankInten < 0) return <span className="text-xs text-blue-400 ml-2">▼ {Math.abs(rankInten)}</span>;
    return <span className="text-xs text-gray-500 ml-2">-</span>;
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group flex flex-col justify-between"
      onClick={() => onMovieSelect(movie)}
    >
      <div>
        <div className="relative">
          <img src={imageUrl} alt={movie.title || movie.movieNm} className="w-full h-auto aspect-[2/3] object-cover" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/500x750/1f2937/9ca3af?text=No+Image"; }}/>
          {rank && (
            <div className="absolute top-0 left-0 bg-purple-500 text-white text-xl font-bold px-3 py-1 rounded-br-lg flex items-center">
              <span>{rank}</span>
              {sectionTitle === '박스오피스 순위' && <RankInfo />}
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-center p-2">상세보기</p>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-md truncate text-white">{movie.title || movie.movieNm}</h3>
          <p className="text-sm text-gray-400">{renderDate()}</p>
        </div>
      </div>
      
      <div className="p-3 pt-0">
        <div className="flex items-center text-sm text-yellow-400 mb-2">
          <span>★</span>
          <span className="ml-1 font-bold">{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {movie.genre_ids?.slice(0, 2).map(id => (
            <span key={id} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
              {genres[id]}
            </span>
          ))}
        </div>
        {movie.audiAcc && (
          <p className="text-xs text-gray-500 mt-2">
            <span className="font-semibold">관객</span> {parseInt(movie.audiAcc).toLocaleString()} 명
          </p>
        )}
        {movie.salesAcc && (
          <p className="text-xs text-gray-500">
            <span className="font-semibold">매출</span> {parseInt(movie.salesAcc).toLocaleString()} 원
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;