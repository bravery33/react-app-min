import React, { useState, useEffect } from 'react';
import './App.css';

import Header from './components/Header/Header';
import MovieSection from './components/MovieSection/MovieSection';
import MovieDetail from './components/MovieDetail/MovieDetail';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import Footer from './components/Footer/Footer';
import SearchResults from './components/SearchResults/SearchResults';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const KOBIS_API_KEY = process.env.REACT_APP_KOBIS_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const KOBIS_BASE_URL = "https://www.kobis.or.kr/kobisopenapi/webservice/rest";

export default function App() {
  const [reReleaseMovies, setReReleaseMovies] = useState([]);
  const [upcomingReReleases, setUpcomingReReleases] = useState([]);
  const [boxOfficeMovies, setBoxOfficeMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tmdbGenres, setTmdbGenres] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('movie-favorites'));
      if (Array.isArray(storedFavorites)) {
        setFavorites(storedFavorites);
      }
    } catch (error) {
      console.error("Failed to parse favorites from localStorage", error);
      setFavorites([]);
    }

    if (!TMDB_API_KEY || !KOBIS_API_KEY) {
      setError("API 키가 .env 파일에 설정되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    const fetchAllMovieData = async () => {
      if (searchQuery) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const genreResponse = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=ko-KR`);
        const genreData = await genreResponse.json();
        const genresMap = genreData.genres.reduce((acc, genre) => {
          acc[genre.id] = genre.name;
          return acc;
        }, {});
        setTmdbGenres(genresMap);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const targetDt = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

        const kobisResponse = await fetch(`${KOBIS_BASE_URL}/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${targetDt}`);
        if (!kobisResponse.ok) throw new Error('KOBIS 박스오피스 데이터를 가져오는데 실패했습니다.');
        const kobisData = await kobisResponse.json();
        if (kobisData.faultInfo) throw new Error(`KOBIS API 오류: ${kobisData.faultInfo.message}`);
        const dailyBoxOfficeList = kobisData.boxOfficeResult.dailyBoxOfficeList || [];

        const enrichedBoxOfficeMovies = await Promise.all(
          dailyBoxOfficeList.map(async (movie) => {
            const year = movie.openDt ? movie.openDt.substring(0, 4) : null;

            let searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.movieNm)}&language=ko-KR`;
            if (year) {
              searchUrl += `&primary_release_year=${year}`;
            }

            let tmdbSearchResponse = await fetch(searchUrl);
            let tmdbSearchData = await tmdbSearchResponse.json();

            if (tmdbSearchData.results.length === 0 && year) {
              const fallbackSearchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.movieNm)}&language=ko-KR`;
              tmdbSearchResponse = await fetch(fallbackSearchUrl);
              tmdbSearchData = await tmdbSearchResponse.json();
            }

            const tmdbMovie = tmdbSearchData.results[0];
            return { ...movie, ...tmdbMovie };
          })
        );
        console.log("TMDb 정보가 합쳐진 후의 박스오피스 목록:", enrichedBoxOfficeMovies);

        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

        const reReleases = enrichedBoxOfficeMovies.filter(movie => {
          if (!movie.openDt) return false;

          let dateToCompare;
          if (movie.openDt.includes('-')) {
            dateToCompare = new Date(movie.openDt);
          } else {
            const dateStr = movie.openDt;
            const formattedDateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            dateToCompare = new Date(formattedDateStr);
          }
          return dateToCompare < fiveYearsAgo;
        });

        setReReleaseMovies(reReleases);
        setBoxOfficeMovies(enrichedBoxOfficeMovies);

        const upcomingResponse = await fetch(`${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=ko-KR&region=KR`);
        if (!upcomingResponse.ok) throw new Error('TMDb 상영 예정작 데이터를 가져오는데 실패했습니다.');
        const upcomingData = await upcomingResponse.json();
        setUpcomingMovies(upcomingData.results);

        const reReleasePromises = upcomingData.results.map(async (movie) => {
          const detailResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
          const detailData = await detailResponse.json();
          if (detailData.release_date && new Date(detailData.release_date) < fiveYearsAgo) {
            return { ...movie, original_release_date: detailData.release_date, reReleaseDate: movie.release_date };
          }
          return null;
        });

        const filteredReleases = (await Promise.all(reReleasePromises)).filter(Boolean);
        setUpcomingReReleases(filteredReleases);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMovieData();
  }, [searchQuery]);

  const saveToLocalStorage = (items) => {
    localStorage.setItem('movie-favorites', JSON.stringify(items));
  };

  const addFavoriteMovie = (movie) => {
    const newFavoriteList = [...favorites, movie];
    setFavorites(newFavoriteList);
    saveToLocalStorage(newFavoriteList);
  };

  const removeFavoriteMovie = (movie) => {
    const newFavoriteList = favorites.filter((favorite) => favorite.id !== movie.id);
    setFavorites(newFavoriteList);
    saveToLocalStorage(newFavoriteList);
  };

  const searchMovies = async (query) => {
    if (!query) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ko-KR`
      );
      if (!response.ok) throw new Error('검색 결과를 가져오는데 실패했습니다.');
      const data = await response.json();
      setSearchResults(data.results);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      searchMovies(query);
    } else {
      setSearchResults([]);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (selectedMovie) return (
    <MovieDetail
      movie={selectedMovie}
      onBack={() => setSelectedMovie(null)}
      apiKey={TMDB_API_KEY}
      baseUrl={TMDB_BASE_URL}
      favorites={favorites}
      onAddFavorite={addFavoriteMovie}
      onRemoveFavorite={removeFavoriteMovie}
    />
  );

  return (
    <div className="App">
      <Header onSearch={handleSearch} />
      <main className="container mx-auto px-4 py-8">
        {searchQuery ? (
          <SearchResults
            movies={searchResults}
            onMovieSelect={setSelectedMovie}
            genres={tmdbGenres}
          />
        ) : (
          <>
            <MovieSection title="즐겨찾기" movies={favorites} onMovieSelect={setSelectedMovie} genres={tmdbGenres} />
            <MovieSection title="재개봉 화제작" movies={reReleaseMovies} onMovieSelect={setSelectedMovie} genres={tmdbGenres} />
            <MovieSection title="재개봉 예정작" movies={upcomingReReleases} onMovieSelect={setSelectedMovie} genres={tmdbGenres} />
            <MovieSection title="박스오피스 순위" movies={boxOfficeMovies} onMovieSelect={setSelectedMovie} isRanked={true} genres={tmdbGenres} />
            <MovieSection title="상영 예정작" movies={upcomingMovies} onMovieSelect={setSelectedMovie} genres={tmdbGenres} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}