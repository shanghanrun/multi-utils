<script>
  // 1. 상태 선언 (Runes)
  let equation = $state(""); 
  let isFinal = $state(false);

  // 2. 파생 상태 (Derived Rune)
  // equation이 변할 때마다 자동으로 실행되어 결과를 미리 보여줍니다.
  let previewResult = $derived.by(() => {
    try {
      if (equation && !/[\+\-\*\/(\s]$/.test(equation)) {
        const sanitized = equation.replace(/×/g, "*").replace(/÷/g, "/");
        // eval은 보안상 주의가 필요하지만, 가젯 수준에서는 로직 확인용으로 적합합니다.
        return eval(sanitized).toLocaleString();
      }
      return "";
    } catch {
      return "";
    }
  });

  // 함수들
  function handleInput(value) {
    if (isFinal) {
      equation = "";
      isFinal = false;
    }
    equation += value;
  }

  function handleBracket() {
    if (isFinal) { equation = ""; isFinal = false; }
    const openBrackets = (equation.match(/\(/g) || []).length;
    const closeBrackets = (equation.match(/\)/g) || []).length;

    if (openBrackets > closeBrackets && /[0-9\)]$/.test(equation)) {
      equation += ")";
    } else {
      equation += "(";
    }
  }

  function clear() {
    equation = "";
    isFinal = false;
  }

  function showFinal() {
    if (previewResult !== "") {
      equation = previewResult.replace(/,/g, "");
      isFinal = true;
    }
  }
</script>

<div class="calculator">
  <div class="display">
    <div class="equation-area" class:final={isFinal}>
      {equation || "0"}
    </div>
    <div class="preview-area">
      {previewResult}
    </div>
  </div>

  <div class="keypad">
    <button onclick={clear} class="btn-ctrl">C</button>
    <button onclick={handleBracket} class="btn-ctrl">( )</button>
    <button onclick={() => equation = equation.slice(0, -1)} class="btn-ctrl">⌫</button>
    <button onclick={() => handleInput('÷')} class="btn-op">÷</button>

    <button onclick={() => handleInput('7')}>7</button>
    <button onclick={() => handleInput('8')}>8</button>
    <button onclick={() => handleInput('9')}>9</button>
    <button onclick={() => handleInput('×')} class="btn-op">×</button>

    <button onclick={() => handleInput('4')}>4</button>
    <button onclick={() => handleInput('5')}>5</button>
    <button onclick={() => handleInput('6')}>6</button>
    <button onclick={() => handleInput('-')} class="btn-op">-</button>

    <button onclick={() => handleInput('1')}>1</button>
    <button onclick={() => handleInput('2')}>2</button>
    <button onclick={() => handleInput('3')}>3</button>
    <button onclick={() => handleInput('+')} class="btn-op">+</button>

    <button onclick={() => handleInput('00')}>00</button>
    <button onclick={() => handleInput('0')}>0</button>
    <button onclick={() => handleInput('.')}>.</button>
    <button onclick={showFinal} class="btn-equal">=</button>
  </div>
</div>

<style>
  .calculator {
    width: 340px;
    background: #ffffff;
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }

  .display {
    height: 120px;
    text-align: right;
    padding: 10px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .equation-area {
    font-size: 1.8rem;
    color: #333;
    word-wrap: break-word;
    transition: all 0.2s;
  }

  .equation-area.final {
    font-size: 2.2rem;
    font-weight: bold;
    color: #2e7d32;
  }

  .preview-area {
    height: 30px;
    font-size: 1.2rem;
    color: #999;
    margin-top: 5px;
  }

  .keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  button {
    height: 65px;
    border: none;
    border-radius: 50px;
    font-size: 1.4rem;
    cursor: pointer;
    background: #f7f8fa;
    color: #1a1a1a;
    transition: background 0.2s;
  }

  button:active { background: #e2e4e7; }

  .btn-ctrl { color: #f44336; font-weight: bold; }
  .btn-op { color: #2e7d32; font-weight: bold; background: #f1f8e9; }
  .btn-equal { background: #2e7d32; color: white; font-weight: bold; }
  .btn-equal:active { background: #1b5e20; }
</style>