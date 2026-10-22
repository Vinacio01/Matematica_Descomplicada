(() => {
  // Dados de demonstração. Uma integração futura poderá substituir apenas esta fonte
  // pelos quatro campos retornados por GET /api/progresso.
  const demoProgress = { acertos: 18, erros: 4, sequencia_atual: 5, recorde: 9 };
  const total = demoProgress.acertos + demoProgress.erros;
  const accuracy = total === 0 ? 0 : Math.round((demoProgress.acertos / total) * 100);

  document.getElementById('correct-count').textContent = demoProgress.acertos;
  document.getElementById('mistake-count').textContent = demoProgress.erros;
  document.getElementById('streak-count').textContent = demoProgress.sequencia_atual;
  document.getElementById('record-count').textContent = demoProgress.recorde;
  document.getElementById('total-count').textContent = total;
  document.getElementById('accuracy-count').textContent = `${accuracy}%`;
})();
