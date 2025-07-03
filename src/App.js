import React, { useState, useEffect } from 'react';
import './App.css';

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const KOBIS_API_KEY = process.env.REACT_APP_KOBIS_API_KEY;

// --- API 요청 URL ---
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const KOBIS_BASE_URL = "http://www.kobis.or.kr/kobisopenapi/webservice/rest";

// --- 메인 앱 컴포넌트 ---
export default function App() {
  // --- 상태 관리 ---
  const [reReleaseMovies, setReReleaseMovies] = useState([]); // 재개봉 영화
  const [boxOfficeMovies, setBoxOfficeMovies] = useState([]); // 박스오피스
  const [upcomingMovies, setUpcomingMovies] = useState([]); // 상영 예정작
  const [selectedMovie, setSelectedMovie] = useState(null); // 사용자가 선택한 영화
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null); // 에러 상태

  // --- 데이터 로딩 ---
  useEffect(() => {
    // API 키가 비어있는지 확인 (선택 사항이지만 좋은 습관입니다)
    if (!TMDB_API_KEY.trim() || !KOBIS_API_KEY.trim()) {
      setError("API 키가 설정되지 않았습니다. 코드 상단의 TMDB_API_KEY와 KOBIS_API_KEY를 확인하세요.");
      setIsLoading(false);
      return;
    }

    // 모든 영화 데이터를 가져오는 비동기 함수
    const fetchAllMovieData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. KOBIS에서 일일 박스오피스 데이터 가져오기 (어제 날짜 기준)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const targetDt = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

        const kobisResponse = await fetch(
          `${KOBIS_BASE_URL}/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${targetDt}`
        );
        if (!kobisResponse.ok) throw new Error('KOBIS 박스오피스 데이터를 가져오는데 실패했습니다.');
        const kobisData = await kobisResponse.json();
        // API 오류 응답 처리 (예: 잘못된 키)
        if (kobisData.faultInfo) {
          throw new Error(`KOBIS API 오류: ${kobisData.faultInfo.message}`);
        }
        const dailyBoxOfficeList = kobisData.boxOfficeResult.dailyBoxOfficeList || [];

        // 2. 박스오피스 목록으로 TMDb에서 상세 정보(포스터 등) 가져오기
        const enrichedBoxOfficeMovies = await Promise.all(
          dailyBoxOfficeList.map(async (movie) => {
            const tmdbSearchResponse = await fetch(
              `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.movieNm)}&language=ko-KR`
            );
            const tmdbSearchData = await tmdbSearchResponse.json();
            const tmdbMovie = tmdbSearchData.results[0];
            return { ...movie, ...tmdbMovie }; // KOBIS 정보와 TMDb 정보를 합침
          })
        );

        // 3. 재개봉 영화 필터링
        // 개봉일(openDt)이 5년 이상 지난 영화를 재개봉으로 간주
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

        const reReleases = enrichedBoxOfficeMovies.filter(movie => {
          if (!movie.openDt) return false;
          const openDate = new Date(movie.openDt);
          return openDate < fiveYearsAgo;
        });

        setReReleaseMovies(reReleases);
        setBoxOfficeMovies(enrichedBoxOfficeMovies);

        // 4. TMDb에서 상영 예정작 데이터 가져오기
        const upcomingResponse = await fetch(
          `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=ko-KR&region=KR`
        );
        if (!upcomingResponse.ok) throw new Error('TMDb 상영 예정작 데이터를 가져오는데 실패했습니다.');
        const upcomingData = await upcomingResponse.json();
        setUpcomingMovies(upcomingData.results);

      } catch (err) {
        console.error(err);
        // 좀 더 구체적인 에러 메시지를 표시합니다.
        setError(`데이터를 불러오는 중 문제가 발생했습니다: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMovieData();
  }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행

  // --- 렌더링 로직 ---
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (selectedMovie) {
    return <MovieDetail movie={selectedMovie} onBack={() => setSelectedMovie(null)} />;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <MovieSection title="재개봉 화제작" movies={reReleaseMovies} onMovieSelect={setSelectedMovie} />
        <MovieSection title="박스오피스 순위" movies={boxOfficeMovies} onMovieSelect={setSelectedMovie} isRanked={true} />
        <MovieSection title="상영 예정작" movies={upcomingMovies} onMovieSelect={setSelectedMovie} />
      </main>
      <Footer />
    </div>
  );
}

// --- 컴포넌트 ---

// 헤더
const Header = () => (
  <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-purple-500/10">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <h1 className="text-2xl md:text-3xl font-bold text-white">
        <span className="text-purple-400">Movie</span> Archive
      </h1>
      <p className="text-sm text-gray-400 hidden md:block">당신이 놓친 명작을 다시 만나보세요</p>
    </div>
  </header>
);

// 영화 섹션
const MovieSection = ({ title, movies, onMovieSelect, isRanked = false }) => {
  if (!movies || movies.length === 0) {
    // 재개봉 영화가 없을 경우 메시지 표시
    if (title === "재개봉 화제작") {
      return (
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 border-l-4 border-purple-400 pl-4">{title}</h2>
          <p className="text-gray-400">현재 상영 중인 재개봉 영화가 없습니다.</p>
        </section>
      );
    }
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-l-4 border-purple-400 pl-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {movies.map((movie, index) => (
          <MovieCard
            key={movie.id || movie.movieCd}
            movie={movie}
            onMovieSelect={onMovieSelect}
            rank={isRanked ? movie.rank : null}
          />
        ))}
      </div>
    </section>
  );
};

// 영화 카드
const MovieCard = ({ movie, onMovieSelect, rank }) => {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image";

  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group"
      onClick={() => onMovieSelect(movie)}
    >
      <div className="relative">
        <img src={imageUrl} alt={movie.title || movie.movieNm} className="w-full h-auto aspect-[2/3] object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image"; }} />
        {rank && (
          <div className="absolute top-0 left-0 bg-purple-500 text-white text-xl font-bold px-3 py-1 rounded-br-lg">
            {rank}
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white text-center p-2">상세보기</p>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-md truncate text-white">{movie.title || movie.movieNm}</h3>
        <p className="text-sm text-gray-400">{movie.release_date || movie.openDt}</p>
      </div>
    </div>
  );
};

// 영화 상세 정보
const MovieDetail = ({ movie, onBack }) => {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <button
        onClick={onBack}
        className="mb-8 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
      >
        &larr; 뒤로가기
      </button>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <img src={imageUrl} alt={movie.title || movie.movieNm} className="w-full rounded-lg shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image"; }} />
        </div>
        <div className="md:w-2/3">
          <h2 className="text-4xl font-bold mb-2">{movie.title || movie.movieNm}</h2>
          <p className="text-lg text-gray-400 mb-4">{movie.original_title}</p>
          <div className="flex items-center mb-4 space-x-4">
            <span className="text-yellow-400">★ {movie.vote_average?.toFixed(1) || 'N/A'}</span>
            <span>|</span>
            <span>개봉: {movie.release_date || movie.openDt}</span>
            {movie.audiAcc && <span>|</span>}
            {movie.audiAcc && <span>누적 관객: {parseInt(movie.audiAcc).toLocaleString()}명</span>}
          </div>
          <p className="text-gray-300 leading-relaxed">{movie.overview || "줄거리 정보가 없습니다."}</p>
        </div>
      </div>
    </div>
  );
};

// 로딩 스피너
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-900">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

// 에러 메시지
const ErrorMessage = ({ message }) => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white p-4">
    <div className="bg-red-900/50 border border-red-500 p-8 rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-400">오류가 발생했습니다</h2>
      <p className="text-red-300">{message}</p>
      <p className="mt-4 text-sm text-gray-400">API 키가 정확한지, 인터넷 연결이 안정적인지 확인해주세요.</p>
    </div>
  </div>
);

// 푸터
const Footer = () => (
  <footer className="bg-gray-900 border-t border-gray-800 mt-12">
    <div className="container mx-auto py-6 px-4 text-center text-gray-500">
      <p>Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">TMDb</a> and <a href="http://www.kobis.or.kr/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">KOBIS</a></p>
      <p className="text-sm mt-2">This product uses the TMDb API but is not endorsed or certified by TMDb.</p>
    </div>
  </footer>
);