<script>
	import { page } from '$app/state'; // Svelte 5 방식의 페이지 상태 감지

	let { children } = $props();
  // 현재 경로와 링크의 경로가 일치하는지 확인하는 함수
  const isActive = (path) => page.url.pathname === path;
</script>

<div class="app-container">
  <nav>
    <a href="/" class:active={isActive('/')}>계산기</a>
    <a href="/unit-converter" class:active={isActive('/unit-converter')}>단위 계산기</a>
    <a href="/timer" class:active={isActive('/timer')}>타이머</a>
    <a href="/calendar" class:active={isActive('/calendar')}>달력</a>
  </nav>

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

  /* 실제 페이지 내용이 들어가는 영역 */
  .content-area {
    width: 100%;
    max-width: 1400px; /* 너무 퍼지지 않게 최대 너비 제한 */
    padding: 20px;
    display: flex;
    justify-content: center; /* 내부의 달력 등을 중앙으로 */
  }
</style>