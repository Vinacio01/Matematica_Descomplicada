(() => {
  const key = 'matematica-descomplicada-partida';
  const limit = 10;

  function starsFor(correct) {
    if (correct === 10) return 3;
    if (correct >= 7) return 2;
    if (correct >= 4) return 1;
    return 0;
  }

  function read() {
    let state;
    try {
      state = JSON.parse(sessionStorage.getItem(key));
    } catch {
      return null;
    }
    if (!state || !['adventure', 'free'].includes(state.mode)) return null;
    const { answered, correct, errors, result } = state;
    if (![answered, correct, errors].every(Number.isInteger) ||
        answered < 0 || answered > limit || correct < 0 || errors < 0 ||
        correct + errors !== answered) return null;
    if (state.mode === 'adventure') {
      if (answered === limit) {
        if (!result || result.correct !== correct || result.errors !== errors ||
            result.stars !== starsFor(correct)) return null;
      } else if (result !== null) return null;
    }
    return state;
  }

  function save(state) {
    sessionStorage.setItem(key, JSON.stringify(state));
    return state;
  }

  function start(mode) {
    if (!['adventure', 'free'].includes(mode)) return null;
    return save({ mode, answered: 0, correct: 0, errors: 0, result: null });
  }

  function record(correctAnswer, questionNumber) {
    const state = read();
    if (!state || state.mode !== 'adventure' || state.result ||
        state.answered !== questionNumber - 1) return null;
    state.answered += 1;
    if (correctAnswer) state.correct += 1;
    else state.errors += 1;
    if (state.answered === limit) {
      state.result = { correct: state.correct, errors: state.errors, stars: starsFor(state.correct) };
    }
    return save(state);
  }

  window.MathGame = { limit, read, start, record, starsFor };
})();
