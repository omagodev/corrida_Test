# corrida_Test

**DRIFT CIRCUIT** - jogo de corrida arcade top-down feito em HTML5 Canvas e JavaScript puro:
drift, nitro, rival controlado por IA e modo Time Attack de 3 voltas.

| Pagina | Arquivo | O que e |
| --- | --- | --- |
| Jogo | [`index.html`](index.html) | O jogo completo, em um unico arquivo. |
| Divulgacao | [`landing.html`](landing.html) | Landing page sobre o projeto: recursos, controles, como jogar e FAQ. |

## Como rodar

Nao ha passo de build, dependencias ou arquivos de configuracao. Abra `index.html`
(ou `landing.html`) no navegador - por um servidor estatico ou direto do disco, com
um duplo clique. Tudo funciona offline: nenhum recurso externo e carregado e os
graficos e sons sao gerados em tempo de execucao pelo proprio navegador.

## Testes

Os testes de regressao usam apenas o executor nativo do Node.js (`node:test`), sem
nenhuma dependencia para instalar:

```
npm test
```

Ou, sem npm:

```
node --test
```

Eles cobrem a landing page (metadados, links e ancoras validos, ausencia de
recursos externos e de qualquer configuracao necessaria) e o shell do jogo
(elementos que o script usa e links entre as duas paginas).

## Controles

| Tecla | Acao |
| --- | --- |
| `↑` / `W` | Acelerar |
| `↓` / `S` | Frear e dar marcha a re |
| `←` `→` / `A` `D` | Estercar |
| `Espaco` | Drift |
| `Shift` | Nitro |
| `Enter` | Iniciar a corrida |
| `P` | Pausar e retomar |
| `M` | Ligar e desligar o som |
| `R` | Voltar para a pista |
