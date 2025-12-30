<script>
  // 1. 상태 관리 (Runes)
  let today = new Date();
  let viewDate = $state(new Date()); 
  let selectedDate = $state(today.getDate());
  
  let memos = $state({}); // 좌측 메모
  let isEditing = $state(false);

  // 우측 기념일 설정 (텍스트 입력 방식)
  let anniversaryInput = $state("12.25: 크리스마스\n1.1: 신정\n4.1: 식목일");
  
  // 2. 파생 데이터: 기념일 텍스트를 객체 배열로 파싱
  let anniversaryMap = $derived.by(() => {
    const map = {};
    const lines = anniversaryInput.split('\n');
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
        hasMemo: memos[key] && memos[key].trim() !== "",
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

<div class="calendar-wrapper">
  <aside class="sidebar memo-side">
    <h3>{month + 1}월 {selectedDate}일 메모</h3>
    <div class="box">
      {#if isEditing}
        <textarea bind:value={memos[dateKey]} placeholder="메모 입력..."></textarea>
      {:else}
        <div class="display-text">{memos[dateKey] || "메모가 없습니다."}</div>
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
        bind:value={anniversaryInput} 
        placeholder="예) 12.25: 크리스마스"
      ></textarea>
    </div>
  </aside>
</div>

<style>
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
</style>