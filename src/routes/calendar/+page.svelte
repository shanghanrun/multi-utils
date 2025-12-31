<script>
import { auth, calendarState } from '$lib/pb.svelte.js';
import { onMount } from 'svelte';

  // 1. 상태 관리 (Runes)
  let isEditing = $state(false);
  let today = new Date();
  let viewDate = $state(new Date()); 
  let selectedDate = $state(today.getDate());

  let showEmailForm = $state(false); // 이메일 입력창 표시 여부
  let isSignUpMode = $state(false);  // 가입 vs 로그인 모드
  let email = $state("");
  let password = $state("");
  let name = $state("")

  // 임시계정 로그인 처리 함수
  async function handleLogin(email, password) {
    try {
      await auth.login(email, password);
      // 로그인 성공 후 데이터를 바로 불러오기 위해 onMount에서 썼던 로직 실행

	    // [중요] 데이터를 불러오기 전, 화면을 즉시 초기화합니다.
      // 이렇게 하면 이전 계정의 데이터가 0.1초도 보이지 않게 됩니다.
      calendarState.recordId = null;
      calendarState.memos = {};
      calendarState.anniversaryInput = "";

      // 그 다음 서버 데이터를 비동기로 가져옵니다.
      await loadCalendarData();

      // 입력 필드 초기화 (필요시)
      clearInputs(); 
	 
    } catch (e) {
      alert("로그인 실패: " + e.message);
    }
  }

  // 이메일 가입/로그인 통합 처리
  async function handleEmailAuth() {
    if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");

    if (isSignUpMode) {
      // 가입 모드 실행
      if(!name) return alert("이름을 입력해 주세요")
      await auth.signUp(email, password, name);

      // 가입 성공 후 초기화
      if (auth.isValid) {
        clearInputs();
      }
    } else {
      // 로그인 모드 실행
      try {
        await auth.login(email, password);
        // 로그인 성공 후 초기화
        if (auth.isValid) clearInputs();
      } catch (err) {
        // 계정이 없는 경우 등 에러 발생 시 안내
        alert("계정이 없거나 비밀번호가 틀렸습니다. 가입하지 않으셨다면 '신규 가입'을 먼저 진행해주세요.");
      }
    }
  }

  // 입력 필드들을 모두 비우는 함수
  function clearInputs() {
    email = "";
    password = "";
    name = "";
  } 

  // 데이터 로딩 로직을 별도 함수로 분리 (로그인 직후 재사용 위해)
  async function loadCalendarData() {
      if (auth.isValid) {      

      try {
        const record = await auth.client.collection('calendar').getFirstListItem(
          `user = "${auth.user.id}"`
        );
        if (record) {
          //layout 페이지에서도 사용할 수 있도록 전역 상태로 로드
		      calendarState.recordId = record.id;
          calendarState.memos = record.memo || {};
          calendarState.anniversaryInput = record.anniversary || "";
        }
      } catch (err) {
        console.log("신규 사용자 이거나 데이터가 없습니다.");
      }
    }
  }

  onMount(loadCalendarData);
	 

  
  
  // 2. 파생 데이터: 기념일 텍스트를 객체 배열로 파싱
  let anniversaryMap = $derived.by(() => {
    const map = {};
    const lines = calendarState.anniversaryInput.split('\n');
    lines.forEach(line => {
      const [datePart, name] = line.split(':');
      if (datePart && name) {
        const [m, d] = datePart.trim().split('.').map(Number);
        if (m && d) {
          map[`${m}-${d}`] = name.trim();
        }
      }
    });
    return map;
  });

  let year = $derived(viewDate.getFullYear());
  let month = $derived(viewDate.getMonth());
  let dateKey = $derived(`${year}-${month + 1}-${selectedDate}`);

  let days = $derived.by(() => {
    const firstDay = new Date(year, month, 1).getDay(); 
    const lastDate = new Date(year, month + 1, 0).getDate();
    let calendarDays = [];
    let mondayCount = 0;

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push({ day: '', currentMonth: false });
    }
    
    for (let i = 1; i <= lastDate; i++) {
      const dayOfWeek = new Date(year, month, i).getDay();
      let showLunar = (dayOfWeek === 1 && (++mondayCount === 1 || mondayCount === 3 || mondayCount === 5));

      const key = `${year}-${month + 1}-${i}`;
      const annivName = anniversaryMap[`${month + 1}-${i}`];

      calendarDays.push({ 
        day: i, 
        currentMonth: true,
        isToday: year === today.getFullYear() && month === today.getMonth() && i === today.getDate(),
        lunar: showLunar ? `(${month + 1}.${(i % 28) + 1})` : null,
        hasMemo: calendarState.memos[key] && calendarState.memos[key].trim() !== "",
        anniversary: annivName // 기념일 이름 저장
      });
    }
    return calendarDays;
  });

  function selectDate(day) {
    if (!day) return;
    selectedDate = day;
    isEditing = false;
  }
</script>




{#if !auth.isValid}
  <div class="auth-container">
    <div class="auth-box">
      <h3>달력 서비스를 이용하시려면 로그인하세요</h3>
      
      {#if !showEmailForm}
        <button class="login-btn guest" onclick={() => handleLogin('test@test.com', '12345678')}>
          임시 계정으로 바로 시작하기
        </button>

        <div class="divider"><span>또는</span></div>

        <div class="auth-methods">
          <!-- <button class="social-btn google" onclick={() => auth.loginWithGoogle()}>
            <img src="/OIP.jpg" alt="G" class="google-logo"/>
            구글로 계속하기
          </button> -->

          <button class="social-btn email" onclick={() => { showEmailForm = true; isSignUpMode = false; }}>
            📧 이메일로 로그인
          </button>
        </div>

        <div class="signup-footer">
          본인계정을 생성해서 따로 저장하고 싶으신가요? 
          <button onclick={() => {showEmailForm=true; isSignUpMode =true;}}>신규 가입(Sign In)</button>
        </div>
      {:else}
        <div class="email-form">
          <h3>{isSignUpMode ? '회원가입' : '로그인'}</h3>
          <p class="form-desc">
            {isSignUpMode ? '정보를 입력하여 새 계정을 만드세요.\n\이메일은 id@gmail.com형식\n비밀번호는 8자리입니다.' : '등록된 이메일로 로그인하세요.'}
          </p>
          {#if isSignUpMode}
            <input type="text" bind:value={name} placeholder="사용자 이름" />
          {/if}
          
          <input type="email" bind:value={email} placeholder="이메일 주소" />
          <input type="password" bind:value={password} placeholder="비밀번호" />
          
          <button class="login-btn primary" onclick={handleEmailAuth}>
            {isSignUpMode ? '가입하기' : '로그인'}
          </button>

          <div class="form-footer">
            {#if !isSignUpMode}
              계정이 없으신가요? <button onclick={() => isSignUpMode = true}>가입 먼저 하세요</button>
            {:else}
              이미 가입하셨나요? <button onclick={() => isSignUpMode = false}>로그인하기</button>
            {/if}
          </div>
          
          <button class="back-btn" onclick={() => showEmailForm = false}>뒤로 가기</button>
        </div>
      {/if}
    </div>
  </div>

{:else}
  


<div class="calendar-wrapper">
  <aside class="sidebar memo-side">
    <h3>{month + 1}월 {selectedDate}일 메모</h3>
    <div class="box">
      {#if isEditing}
        <textarea bind:value={calendarState.memos[dateKey]} placeholder="메모 입력..."></textarea>
      {:else}
        <div class="display-text">{calendarState.memos[dateKey] || "메모가 없습니다."}</div>
      {/if}
    </div>
    <button class="btn" onclick={() => isEditing = !isEditing}>{isEditing ? "완료" : "수정"}</button>
  </aside>

  <main class="calendar-container">
    <div class="header">
      <button class="nav-btn" onclick={() => viewDate = new Date(year, month - 1, 1)}>◀</button>
      <h2>{year}년 {month + 1}월</h2>
      <button class="nav-btn" onclick={() => viewDate = new Date(year, month + 1, 1)}>▶</button>
    </div>

    <div class="calendar-grid">
      {#each ['일', '월', '화', '수', '목', '금', '토'] as d}
        <div class="day-header" class:sun={d === '일'}>{d}</div>
      {/each}

      {#each days as item}
        <button 
          class="day-cell" 
          class:today={item.isToday} 
          class:selected={selectedDate === item.day}
          class:empty={!item.day}
          class:is-anniv={item.anniversary}
          onclick={() => selectDate(item.day)}
        >
          <div class="solar-row">
            <span class="solar">{item.day}</span>
            {#if item.hasMemo}<span class="star">*</span>{/if}
          </div>
          
          {#if item.anniversary}
            <span class="anniv-label">{item.anniversary}</span>
          {:else if item.lunar}
            <span class="lunar">{item.lunar}</span>
          {/if}
        </button>
      {/each}
    </div>
    <a href="/" class="home-link">← 계산기로 돌아가기</a>
  </main>

  <aside class="sidebar anniv-side">
    <h3>기념일 설정</h3>
    <p class="desc">MM.DD: 이름 형식으로 입력</p>
    <div class="box">
      <textarea 
        bind:value={calendarState.anniversaryInput} 
        placeholder="예) 12.25: 크리스마스"
      ></textarea>
    </div>
  </aside>
</div>
{/if}

<style>
	/* 로그인 전용 중앙 정렬 스타일 */
  .auth-container {
    width: 100%;
    min-height: 400px; /* 최소 높이 보장 */
    display: flex;
    justify-content: center;
    align-items: center;
	}
  .auth-box {
    text-align: center;
    padding: 30px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
  .login-btn {
    background: #2e7d32;
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 10px;
    font-size: 1.1rem;
    cursor: pointer;
	}
  .user-bar {
    max-width: 1400px; /* calendar-wrapper와 동일한 너비 */
    margin: 0 auto 15px auto; /* 중앙 정렬 및 아래쪽 여백 */
    padding: 10px 20px;
    display: flex;
    justify-content: space-between; /* 양 끝 정렬 */
    align-items: center;
    background: #fdfdfd;
    border-radius: 15px;
    border: 1px solid #eee;
  }

  .user-info-text {
    font-size: 0.95rem;
    color: #444;
  }
  .user-actions {
    display: flex;
    gap: 10px;
  }

  .logout-btn {
    background: #f5f5f5;
    border: 1px solid #ddd;
    padding: 8px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: 0.2s;
  }
  .logout-btn:hover { background: #eee; }

  .save-btn { 
    background: #1976d2; 
    color: white; 
    border: none; 
    padding: 8px 18px; 
    border-radius: 8px; 
    cursor: pointer; 
    font-weight: bold;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 2px 5px rgba(25, 118, 210, 0.2);
    transition: 0.2s;
  }
  .save-btn:hover { background: #1565c0; transform: translateY(-1px); }
  



  /* 1. 전체 레이아웃: 최대 너비를 키워 와이드하게 설정 */
  .calendar-wrapper { 
    display: flex; 
    max-width: 1400px; /* 기존 1100px에서 확장 */
    margin: 20px auto; 
    gap: 20px; 
    padding: 20px;
    align-items: stretch; /* 좌우 높이 통일 */
  }
  
  /* 2. 사이드바 확장: flex 값을 1.5로 상향하여 비중 확대 */
  .sidebar { 
    flex: 1.5; 
    background: #f8f9fa; 
    padding: 25px; 
    border-radius: 20px; 
    display: flex; 
    flex-direction: column;
    box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  }

  .box { flex: 1; margin: 15px 0; display: flex; flex-direction: column; }
  
  textarea { 
    flex: 1; width: 100%; padding: 15px; 
    border: 1px solid #ddd; border-radius: 12px; 
    resize: none; font-size: 1rem; line-height: 1.5;
  }

  .display-text { 
    flex: 1; white-space: pre-wrap; padding: 15px; 
    background: white; border-radius: 12px; 
    min-height: 350px; font-size: 1rem; border: 1px solid #eee; 
  }

  /* 3. 중앙 달력 영역 */
  .calendar-container { 
    flex: 3; /* 달력 비중 조절 */
    background: white; 
    padding: 25px; 
    border-radius: 24px; 
    box-shadow: 0 10px 30px rgba(0,0,0,0.05); 
  }

  /* 화살표와 년월을 한 줄로 정렬 */
  .header { display: flex; justify-content: center; align-items: center; gap: 30px; margin-bottom: 25px; }
  .nav-btn { background: #eee; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; }
  .header h2 { margin: 0; font-size: 1.5rem; min-width: 160px; text-align: center; }

  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  
  .day-header { font-size: 0.85rem; font-weight: bold; color: #aaa; text-align: center; padding-bottom: 12px; }
  .day-header.sun { color: #ff5252; }

  .day-cell {
    aspect-ratio: 1/1.3; border: 2px solid transparent; background: none;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
    padding: 8px 4px; border-radius: 12px; cursor: pointer; transition: 0.2s;
    overflow: hidden;
  }

  .solar-row { display: flex; align-items: flex-start; justify-content: center; width: 100%; position: relative; }
  
  .day-cell:hover:not(.empty) { background: #f9f9f9; }
  .day-cell.selected { border-color: #2e7d32; }
  .day-cell.today { background: #2e7d32 !important; color: white !important; }
  
  .day-cell.is-anniv { background-color: #fff0f3; }
  
  /* 기념일 라벨 줄바꿈 적용 */
  .anniv-label { 
    font-size: 0.7rem; color: #d81b60; font-weight: bold; margin-top: 4px;
    text-align: center; line-height: 1.2; word-break: keep-all; 
  }

  .solar { font-size: 1.1rem; font-weight: 600; }
  .star { color: #ffd600; font-size: 1.1rem; margin-left: 2px; }
  .lunar { font-size: 0.65rem; color: #2e7d32; margin-top: 2px; }
  
  .day-cell.today .lunar, .day-cell.today .anniv-label { color: #ffeb3b; }
  .day-cell:nth-child(7n+1):not(.today) .solar { color: #ff5252; }

  .btn { padding: 12px; background: #2e7d32; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
  .desc { font-size: 0.8rem; color: #888; margin-bottom: 10px; }
  .home-link { display: block; margin-top: 20px; text-align: center; color: #aaa; text-decoration: none; font-size: 0.8rem; }



  /* 우측 사이드바 컨테이너 정렬 */
  .sidebar.anniv-side { 
    flex: 1.5; 
    background: #f8f9fa; 
    padding: 25px; 
    border-radius: 20px; 
    display: flex; 
    flex-direction: column;
    align-items: center; /* 내부 요소들을 가로 중앙으로 정렬 */
  }

  /* 기념일 설정 제목과 설명도 중앙 정렬 */
  .sidebar.anniv-side h3, 
  .sidebar.anniv-side .desc {
    width: 100%;
    text-align: center;
  }

  /* 입력 박스 컨테이너 */
  .anniv-side .box { 
    width: 100%; /* 부모 너비 전체 활용 */
    margin: 15px 0; 
    display: flex; 
    justify-content: center; /* 가로 중앙 정렬 */
  }
  
  /* 텍스트 영역: 중앙 배치를 위해 margin: 0 auto 추가 */
  .anniv-side textarea { 
    width: 100%; /* 박스 꽉 차게 설정 */
    max-width: 100%; /* 이탈 방지 */
    height: 350px; /* 충분한 높이 확보 */
    padding: 15px; 
    border: 1px solid #ddd; 
    border-radius: 12px; 
    resize: none; 
    font-size: 1rem; 
    line-height: 1.5;
    box-sizing: border-box; /* 패딩이 너비에 포함되도록 설정 */
    margin: 0 auto; /* 좌우 균등 여백 */
  }


  .auth-box {
    width: 100%;
    max-width: 400px; /* 로그인 박스 너비 제한 */
    padding: 40px;
    background: white;
    border-radius: 24px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    text-align: center;
  }

  .login-btn.guest {
    width: 100%;
    background: #4caf50;
    margin-bottom: 20px;
  }

  .divider {
    margin: 25px 0;
    border-bottom: 1px solid #eee;
    position: relative;
  }
  .divider span {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 0 15px;
    color: #999;
    font-size: 0.85rem;
  }

  .auth-methods {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 30px;
  }

  .social-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
    border: 1px solid #ddd;
    background: white;
  }
  
  .social-btn img { width: 18px; }
  .social-btn:hover { background: #f8f9fa; border-color: #ccc; }

  .google-logo {
    width: 20px;   /* 로고 크기 적절히 조절 */
    height: 20px;
    object-fit: contain;
    margin-right: 8px; /* 텍스트와의 간격 */
  }

  .signup-footer {
    font-size: 0.85rem;
    color: #777;
  }
  .signup-footer button {
    background: none;
    border: none;
    color: #1976d2;
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    margin-left: 5px;
  }

  .guest { background: #34c759; color: white; font-size: 1.1rem; }
  .primary { background: #007aff; color: white; }
  /* .divider { margin: 20px 0; border-bottom: 1px solid #eee; position: relative; }
  .divider span { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; color: #999; font-size: 0.8rem; } */
  .email-form { display: flex; flex-direction: column; gap: 12px; }
  .email-form input { padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
  .back-btn { background: none; border: none; color: #888; text-decoration: underline; cursor: pointer; }
  /* .signup-footer { margin-top: 25px; font-size: 0.9rem; color: #666; }
  .signup-footer button { background: none; border: none; color: #007aff; font-weight: bold; cursor: pointer; } */

</style>