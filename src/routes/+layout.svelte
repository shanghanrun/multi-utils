<script>
	import { page } from '$app/state'; // Svelte 5 방식의 페이지 상태 감지
  import { auth, calendarState } from '$lib/pb.svelte.js';

	let { children } = $props();
  // 현재 경로와 링크의 경로가 일치하는지 확인하는 함수
  const isActive = (path) => page.url.pathname === path;
  // 🌟 달력 페이지 여부 확인 (파생 상태처럼 작동)
  const isCalendarPage = $derived(page.url.pathname === '/calendar');

</script>

<div class="app-container">
  <nav>
    <a href="/" class:active={isActive('/')}>계산기</a>
    <a href="/unit-converter" class:active={isActive('/unit-converter')}>단위 계산기</a>
    <a href="/timer" class:active={isActive('/timer')}>타이머</a>
    <a href="/calendar" class:active={isActive('/calendar')}>달력</a>
  </nav>

  {#if auth.isValid && isCalendarPage}
    <div class="user-bar">
      <div class="user-info-text">
        <strong>{auth.user.name || auth.user.email}</strong>님 환영합니다!
      </div>
      <div class="user-actions">
        <button class="logout-btn" onclick={() => auth.logout()}>로그아웃</button>
        <button class="save-btn" onclick={() => auth.syncToCloud(calendarState)}>
          <span class="icon">☁️</span> 클라우드에 저장
        </button>
      </div>
    </div>
  {/if}

  <main class="content-area">
      {@render children()}
  </main>
</div>

<style>
  /* 전체 배경 및 중앙 정렬을 위한 컨테이너 */
  .app-container {
    display: flex;
    flex-direction: column;
    align-items: center; /* 가로축 중앙 정렬 */
    min-height: 100vh;
    background: #fdfdfd;
  }

  /* 상단 네비게이션 스타일 */
  nav { 
    display: flex; 
    justify-content: center; /* 탭들을 가로 중앙으로 */
    gap: 15px; 
    padding: 1.5rem; 
    background: #f4f4f4; 
    width: 100%; /* 네비게이션 바는 가로 꽉 차게 */
    border-bottom: 1px solid #ddd;
  }
  /* 기본 버튼 스타일: 은은한 테두리 추가 */
  a { 
    text-decoration: none; 
    color: #555; 
    font-weight: bold; 
    padding: 8px 20px;
    border: 1px solid #d0d0d0; /* 은은한 테두리 */
    border-radius: 10px;
    background: #fff;
    transition: all 0.2s ease;
  }

  /* 호버 효과 */
  a:hover { 
    color: #ff3e00; 
    border-color: #ff3e00;
    background: #fff5f2;
  }

  /* 선택된 페이지(활성화 탭) 강조 로직 */
  a.active { 
    background: #2e7d32; /* 선택 시 초록색 배경 */
    color: white; 
    border-color: #2e7d32;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }


  


  .user-bar {
    width: 95%;
    max-width: 1400px;
    /* 빨간 박스 영역: 상단 여백을 40px로 늘림 */
    /* 초록 박스 영역: 하단 여백을 5px로 대폭 줄임 */
    margin: 40px auto 5px auto; 
    
    display: flex;
    justify-content: space-between; /* 정보 좌측, 버튼 우측 */
    align-items: center;
    padding: 15px 25px;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #eee;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  }
  .user-info-text {
    font-size: 1rem;
    color: #444;
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 12px; /* 로그아웃과 저장 버튼 사이 간격 */
  }

  .logout-btn {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.9rem;
    color: #666;
    transition: all 0.2s;
  }
  .logout-btn:hover { background: #e9ecef; color: #333; }

  .save-btn { 
    background: #1976d2; 
    color: white; 
    border: none; 
    padding: 10px 20px;
    border-radius: 10px;
    cursor: pointer; 
    font-weight: bold;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
    transition: all 0.2s;
  }
  .save-btn:hover { background: #1565c0; transform: translateY(-1px); box-shadow: 0 6px 15px rgba(25, 118, 210, 0.3); }

  .content-area {
    width: 100%;
    max-width: 1400px;
    /* 하단 여백이 줄어든 user-bar와 더 밀착되도록 조정 */
    padding: 10px 20px 40px 20px; 
    display: flex;
    justify-content: center;
  }
</style>