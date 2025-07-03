import React, { useState, useEffect } from 'react';
import './App.css';

// --- API 키 설정 ---
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const KOBIS_API_KEY = process.env.REACT_APP_KOBIS_API_KEY;

// --- API 요청 URL ---
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const KOBIS_BASE_URL = "https://www.kobis.or.kr/kobisopenapi/webservice/rest";

// --- 메인 앱 컴포넌트 ---
export default function App() {
  // --- 상태 관리 ---
  const [reReleaseMovies, setReReleaseMovies] = useState([]);
  const [upcomingReReleases, setUpcomingReReleases] = useState([]);
  const [boxOfficeMovies, setBoxOfficeMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tmdbGenres, setTmdbGenres] = useState({});

  // --- 데이터 로딩 ---
  useEffect(() => {
    if (!TMDB_API_KEY || !KOBIS_API_KEY) {
      setError("API 키가 .env 파일에 설정되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    const fetchAllMovieData = async () => {
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
        
        const kobisResponse = await fetch(
          `${KOBIS_BASE_URL}/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${targetDt}`
        );
        if (!kobisResponse.ok) throw new Error('KOBIS 박스오피스 데이터를 가져오는데 실패했습니다.');
        const kobisData = await kobisResponse.json();
        if (kobisData.faultInfo) throw new Error(`KOBIS API 오류: ${kobisData.faultInfo.message}`);
        const dailyBoxOfficeList = kobisData.boxOfficeResult.dailyBoxOfficeList || [];

        const enrichedBoxOfficeMovies = await Promise.all(
          dailyBoxOfficeList.map(async (movie) => {
            const tmdbSearchResponse = await fetch(
              `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movie.movieNm)}&language=ko-KR`
            );
            const tmdbSearchData = await tmdbSearchResponse.json();
            const tmdbMovie = tmdbSearchData.results[0];
            return { ...movie, ...tmdbMovie };
          })
        );
        
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        
        const reReleases = enrichedBoxOfficeMovies.filter(movie => {
          if (!movie.openDt) return false;
          return new Date(movie.openDt) < fiveYearsAgo;
        });
        
        setReReleaseMovies(reReleases);
        setBoxOfficeMovies(enrichedBoxOfficeMovies);

        const upcomingResponse = await fetch(
          `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=ko-KR&region=KR`
        );
        if (!upcomingResponse.ok) throw new Error('TMDb 상영 예정작 데이터를 가져오는데 실패했습니다.');
        const upcomingData = await upcomingResponse.json();
        setUpcomingMovies(upcomingData.results);

        const reReleasePromises = upcomingData.results.map(async (movie) => {
          const detailResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
          const detailData = await detailResponse.json();
          if (detailData.release_date && new Date(detailData.release_date) < fiveYearsAgo) {
            return {
              ...movie,
              original_release_date: detailData.release_date,
              reReleaseDate: movie.release_date
            };
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
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (selectedMovie) return <MovieDetail movie={selectedMovie} onBack={() => setSelectedMovie(null)} />;

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <MovieSection title="재개봉 화제작" movies={reReleaseMovies} onMovieSelect={setSelectedMovie} genres={tmdbGenres} />
        <MovieSection title="재개봉 예정작" movies={upcomingReReleases} onMovieSelect={setSelectedMovie} genres={tmdbGenres} />
        <MovieSection title="박스오피스 순위" movies={boxOfficeMovies} onMovieSelect={setSelectedMovie} isRanked={true} genres={tmdbGenres} />
        <MovieSection title="상영 예정작" movies={upcomingMovies} onMovieSelect={setSelectedMovie} genres={tmdbGenres} />
      </main>
      <Footer />
    </div>
  );
}

// --- 컴포넌트 ---

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
    if (movie.rankOldAndNew === 'NEW') {
      return <span className="text-xs font-bold text-red-400 ml-2">NEW</span>;
    }
    if (rankInten > 0) {
      return <span className="text-xs text-green-400 ml-2">▲ {rankInten}</span>;
    }
    if (rankInten < 0) {
      return <span className="text-xs text-blue-400 ml-2">▼ {Math.abs(rankInten)}</span>;
    }
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

const MovieDetail = ({ movie, onBack }) => {
  // 'providers'를 state에서 제거
  const [details, setDetails] = useState({
    video: null,
    credits: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        // watch/providers API 호출을 제거
        const [videoRes, creditsRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}&language=ko-KR`),
          fetch(`${TMDB_BASE_URL}/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=ko-KR`),
        ]);

        if (!videoRes.ok || !creditsRes.ok) {
            throw new Error("Failed to fetch one or more details");
        }

        const videoData = await videoRes.json();
        const creditsData = await creditsRes.json();
        
        const trailer = videoData.results.find(v => v.type === 'Trailer');
        const director = creditsData.crew.find(c => c.job === 'Director');

        // setDetails에서 providers 관련 로직 제거
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
  }, [movie.id]);

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750/1f2937/9ca3af?text=No+Image";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <button 
        onClick={onBack}
        className="mb-8 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
      >
        ← 뒤로가기
      </button>

      {/* 기본 정보 섹션 */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <img src={imageUrl} alt={movie.title || movie.movieNm} className="w-full rounded-lg shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/500x750/1f2937/9ca3af?text=No+Image"; }} />
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

          {/* '시청 가능한 곳' JSX 렌더링 부분 전체 삭제 */}
          
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
                  <div key={actor.cast_id} className="text-center">
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
  );
};


const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-900">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white p-4">
    <div className="bg-red-900/50 border border-red-500 p-8 rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-400">오류가 발생했습니다</h2>
      <p className="text-red-300">{message}</p>
      <p className="mt-4 text-sm text-gray-400">API 키가 정확한지, 인터넷 연결이 안정적인지 확인해주세요.</p>
    </div>
  </div>
);

const Footer = () => (
    <footer className="bg-gray-900 border-t border-gray-800 mt-12">
        <div className="container mx-auto py-6 px-4 text-center text-gray-500">
            <p>Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">TMDb</a> and <a href="https://www.kobis.or.kr/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">KOBIS</a></p>
            <p className="text-sm mt-2">This product uses the TMDb API but is not endorsed or certified by TMDb.</p>
        </div>
    </footer>
);