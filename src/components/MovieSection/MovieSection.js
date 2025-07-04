import React from 'react';
import MovieCard from '../MovieCard/MovieCard';
import './MovieSection.css';

const MovieSection = ({ title, movies, onMovieSelect, isRanked = false, genres }) => {
  if (!movies || movies.length === 0) {
    if (title === "재개봉 화제작" || title === "재개봉 예정작") {
      return (
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 border-l-4 border-purple-400 pl-4">{title}</h2>
          <p className="text-gray-400">해당하는 영화 정보가 없습니다.</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-l-4 border-purple-400 pl-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id || movie.movieCd} 
            movie={movie} 
            onMovieSelect={onMovieSelect} 
            rank={isRanked ? movie.rank : null}
            sectionTitle={title}
            genres={genres}
          />
        ))}
      </div>
    </section>
  );
};

export default MovieSection;