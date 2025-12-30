<script>
  // 1. 상태 관리 (Runes)
  let minutes = $state(0);
  let seconds = $state(0);
  let isRunning = $state(false);
  let isAlarming = $state(false); // 알람 시각 효과용
  let intervalId = $state(null);

  // 2. 사운드 생성 함수 (Web Audio API)
  function playAlarmSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine'; // 부드러운 사인파 소리
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 음역대
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  // 3. 종료 알람 효과 (반짝임 3회)
  async function triggerAlarm() {
    isAlarming = true;
    for (let i = 0; i < 3; i++) {
      playAlarmSound();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    isAlarming = false;
  }

  function adjustTime(type, amount) {
    if (isRunning || isAlarming) return;
    if (type === 'min') {
      minutes = Math.max(0, Math.min(99, minutes + amount));
    } else {
      seconds += amount;
      if (seconds >= 60) { seconds = 0; minutes = Math.max(0, minutes + 1); }
      else if (seconds < 0) { seconds = 59; minutes = Math.max(0, minutes - 1); }
    }
  }

  function toggleTimer() {
    if (isRunning) {
      stopAndReset();
    } else {
      if (minutes === 0 && seconds === 0) return;
      isRunning = true;
      intervalId = setInterval(() => {
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else {
          stopAndReset();
          triggerAlarm();
        }
      }, 1000);
    }
  }

  function stopAndReset() {
    clearInterval(intervalId);
    intervalId = null;
    isRunning = false;
    if (!isAlarming) { // 알람 중이 아닐 때만 0으로 초기화
        minutes = 0;
        seconds = 0;
    }
  }
</script>

<div class="timer-container" class:alarming={isAlarming}>
  <h2>⏲️ 타이머</h2>

  <div class="timer-display">
    <div class="control-group">
      <button class="arrow" onclick={() => adjustTime('min', 1)} disabled={isRunning}>▲</button>
      <div class="time-box">
        <span class="value">{minutes.toString().padStart(2, '0')}</span>
        <span class="label">MIN</span>
      </div>
      <button class="arrow" onclick={() => adjustTime('min', -1)} disabled={isRunning}>▼</button>
    </div>

    <div class="separator">:</div>

    <div class="control-group">
      <button class="arrow" onclick={() => adjustTime('sec', 1)} disabled={isRunning}>▲</button>
      <div class="time-box">
        <span class="value">{seconds.toString().padStart(2, '0')}</span>
        <span class="label">SEC</span>
      </div>
      <button class="arrow" onclick={() => adjustTime('sec', -1)} disabled={isRunning}>▼</button>
    </div>
  </div>

  <button class="main-btn" class:running={isRunning} onclick={toggleTimer}>
    {isRunning ? "STOP / RESET" : "START"}
  </button>
  
  <a href="/" class="home-link">← 계산기로 돌아가기</a>
</div>

<style>
  .timer-container {
    max-width: 350px;
    margin: 40px auto;
    text-align: center;
    background: #fff;
    padding: 30px;
    border-radius: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: background-color 0.3s ease; /* 배경색 변화를 부드럽게 */
  }

  /* 알람 발생 시 빨간색 반짝임 효과 */
  .alarming {
    animation: flash-red 0.5s infinite alternate;
  }

  @keyframes flash-red {
    from { background-color: #fff; }
    to { background-color: #ffcdd2; }
  }

  .timer-display {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin: 30px 0;
  }

  .control-group { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .time-box { background: rgba(0,0,0,0.05); padding: 15px; border-radius: 15px; min-width: 80px; }
  .value { font-size: 2.5rem; font-weight: bold; font-family: monospace; }
  .label { font-size: 0.7rem; color: #888; display: block; }
  .separator { font-size: 2rem; font-weight: bold; margin-bottom: 30px; }

  .arrow {
    background: #eee; border: none; width: 40px; height: 40px; border-radius: 50%;
    cursor: pointer; font-size: 1.2rem;
  }
  .arrow:disabled { opacity: 0.2; cursor: default; }

  .main-btn {
    width: 100%; padding: 15px; border-radius: 50px; border: none;
    font-size: 1.2rem; font-weight: bold; cursor: pointer;
    background: #2e7d32; color: white; transition: 0.2s;
  }
  .main-btn.running { background: #d32f2f; }

  .home-link { display: block; margin-top: 25px; color: #666; text-decoration: none; font-size: 0.9rem; }
</style>