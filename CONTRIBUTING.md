# Como contribuir

Obrigado pelo interesse em contribuir com o **DRIFT CIRCUIT**! Este guia cobre o fluxo básico para pequenas contribuições.

## Pré-requisitos

- [Git](https://git-scm.com/)
- Um navegador moderno (Chrome, Edge, Firefox ou Safari)
- [Node.js](https://nodejs.org/) em versão LTS recente (já inclui o `npm`), apenas para rodar os testes

Não há dependências para instalar nem etapa de build.

## Passo a passo

1. **Clone o repositório**

   ```bash
   git clone https://github.com/omagodev/corrida_Test.git
   cd corrida_Test
   ```

2. **Abra o jogo**

   O `index.html` pode ser aberto diretamente no navegador, sem servidor:

   ```bash
   start index.html        # Windows
   open index.html         # macOS
   ```

   Se preferir, sirva localmente (opcional) com `python -m http.server 8000` e acesse `http://localhost:8000`.

3. **Crie uma branch** a partir da `main` atualizada

   ```bash
   git checkout main
   git pull
   git checkout -b minha-alteracao
   ```

4. **Faça suas alterações** e confira o resultado abrindo o `index.html` (ou o `landing.html`) no navegador.

5. **Execute os testes antes de abrir o PR**

   ```bash
   npm test
   ```

   O comando roda `node --test` sobre os arquivos em `tests/`. Todos os testes devem passar.

6. **Faça o commit e envie a branch**

   ```bash
   git add <arquivos-alterados>
   git commit -m "Descreva a alteração de forma curta"
   git push -u origin minha-alteracao
   ```

7. **Abra um pull request** para a `main` no GitHub, descrevendo o que mudou e citando a issue relacionada (ex.: `Closes #123`).

## Dicas

- Mantenha cada PR pequeno e focado em um único assunto.
- Ao adicionar comportamento novo, inclua um teste em `tests/` quando fizer sentido.
