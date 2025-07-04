import React from 'react';
import MovieCard from '../MovieCard/MovieCard';
import './SearchResults.css';

const SearchResults = ({ movies, onMovieSelect, genres }) => {
  if (movies.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <h2 className="text-2xl font-bold mb-4">검색 결과가 없습니다.</h2>
        <p>다른 키워드로 검색해보세요.</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-3xl font-bold mb-6 border-l-4 border-purple-400 pl-4">검색 결과</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            onMovieSelect={onMovieSelect} 
            genres={genres}
          />
        ))}
      </div>
    </section>
  );
};

export default SearchResults;