<script>
  // 1. 상태 관리 (Runes)
  let lengthValue = $state(0); // 미터 기준
  let weightValue = $state(0); // 그램 기준
  let usdValue = $state(1);    // 달러 기준
  
    // 환율 관련 상태
  let exchangeRate = $state(1350); 
  let inputValue = $state(1); // 사용자가 입력하는 숫자
  let isUsdToKrw = $state(true); // true: 달러 입력모드, false: 원화 입력모드
  let lastUpdated = $state("");

  // 2. 파생 상태 (Derived Runes) - 값이 변할 때마다 자동 계산
  
  // [거리 변환]
  let miles = $derived((lengthValue * 0.000621371).toFixed(4));
  let yards = $derived((lengthValue * 1.09361).toFixed(2));
  let inches = $derived((lengthValue * 39.3701).toFixed(2));

  // [무게 변환]
  let pounds = $derived((weightValue * 0.00220462).toFixed(4));
  let ounces = $derived((weightValue * 0.035274).toFixed(2));



  // [환율 반전 로직]
  // 모드에 따라 곱하거나 나누어서 계산합니다.
  let convertedResult = $derived.by(() => {
    if (isUsdToKrw) {
      // 달러 -> 원화
      return (inputValue * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 });
    } else {
      // 원화 -> 달러
      return (inputValue / exchangeRate).toFixed(2);
    }
  });

  // [환율 변환]
  let krwResult = $derived((usdValue * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 }));

  // 3. 실시간 환율 API 호출 (Effect Rune)
  $effect(() => {
    async function fetchExchangeRate() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates) {
          exchangeRate = data.rates.KRW;
          lastUpdated = new Date(data.time_last_update_utc).toLocaleString();
        }
      } catch (error) {
        console.error("환율 로딩 실패:", error);
      }
    }
    fetchExchangeRate();
  });



  // 모드 전환 함수
  function toggleMode() {
    // 현재 결과값을 입력값으로 전환하여 연속성 있게 모드 변경 (선택사항)
    const currentRes = isUsdToKrw ? (inputValue * exchangeRate) : (inputValue / exchangeRate);
    inputValue = Number(currentRes.toFixed(isUsdToKrw ? 0 : 2));
    isUsdToKrw = !isUsdToKrw;
  }

</script>

<div class="converter-container">
  <h2>단위 계산기</h2>


  <section class="card currency">
    <div class="card-header">
      <h3>💵 실시간 환율 변환</h3>
      <button class="switch-btn" onclick={toggleMode}>
        {isUsdToKrw ? "USD → KRW" : "KRW → USD"} 🔄
      </button>
    </div>

    <div class="input-group">
      <input type="number" bind:value={inputValue} onfocus={(e) => e.currentTarget.select()} step="0.01"  />
      <span class="unit">{isUsdToKrw ? "달러 ($)" : "원화 (₩)"}</span>
    </div>

    <div class="main-result">
      <span class="symbol">{isUsdToKrw ? "₩" : "$"}</span> 
      {convertedResult} 
      <span class="target-unit">{isUsdToKrw ? "원" : "달러"}</span>
    </div>

    <div class="info">
      <p>현재 환율: 1$ = <strong>{exchangeRate.toFixed(2)}원</strong></p>
      {#if lastUpdated}
        <p class="update-time">업데이트: {lastUpdated}</p>
      {/if}
    </div>
  </section>
  

  <section class="card">
    <h3>📏 거리 (미터 입력)</h3>
    <div class="input-group">
      <input type="number" bind:value={lengthValue} placeholder="미터(m) 입력" />
      <span class="unit">m</span>
    </div>
    <div class="results-grid">
      <div class="res-item"><span>마일</span><strong>{miles}</strong> mi</div>
      <div class="res-item"><span>야드</span><strong>{yards}</strong> yd</div>
      <div class="res-item"><span>인치</span><strong>{inches}</strong> in</div>
    </div>
  </section>

  <section class="card">
    <h3>⚖️ 무게 (그램 입력)</h3>
    <div class="input-group">
      <input type="number" bind:value={weightValue} placeholder="그램(g) 입력" />
      <span class="unit">g</span>
    </div>
    <div class="results-grid">
      <div class="res-item"><span>파운드</span><strong>{pounds}</strong> lb</div>
      <div class="res-item"><span>온스</span><strong>{ounces}</strong> oz</div>
    </div>
  </section>

  
  <a href="/" class="home-link">← 계산기로 돌아가기</a>
</div>

<style>
  .converter-container {
    max-width: 450px;
    margin: 20px auto;
    padding: 0 15px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  h2 { text-align: center; color: #333; margin-bottom: 30px; }

  .card {
    background: #ffffff;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    border: 1px solid #f0f0f0;
  }

  .currency { background: #f1f8e9; border-color: #c8e6c9; }

  h3 { margin: 0 0 15px 0; font-size: 1rem; color: #666; }

  .input-group {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  input {
    flex: 1;
    padding: 12px 15px;
    border: 2px solid #eee;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: bold;
    outline: none;
    transition: border-color 0.2s;
  }

  input:focus { border-color: #2e7d32; }

  .unit { font-weight: bold; color: #333; min-width: 40px; }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 15px;
    border-top: 1px solid #eee;
    padding-top: 15px;
  }

  .res-item { display: flex; flex-direction: column; gap: 5px; }
  .res-item span { font-size: 0.8rem; color: #888; }
  .res-item strong { font-size: 1.1rem; color: #333; }

  .main-result { font-size: 2.2rem; font-weight: bold; color: #2e7d32; margin: 10px 0; }
  .krw-label { font-size: 1.2rem; color: #666; font-weight: normal; }

  .info { font-size: 0.8rem; color: #777; margin-top: 15px; }
  .update-time { font-style: italic; color: #aaa; margin-top: 5px; }

  .home-link {
    display: block;
    text-align: center;
    margin-top: 30px;
    color: #666;
    text-decoration: none;
    font-weight: 500;
  }
  .home-link:hover { color: #2e7d32; }


  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .switch-btn {
    background: #2e7d32;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
  }

  .switch-btn:active { transform: scale(0.95); }

  .main-result {
    font-size: 2.2rem;
    font-weight: bold;
    color: #2e7d32;
    margin: 15px 0;
    word-break: break-all;
  }

  .target-unit { font-size: 1.1rem; color: #666; font-weight: normal; margin-left: 5px; }

</style>