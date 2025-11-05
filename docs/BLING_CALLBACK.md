# Bling callback URL

O endpoint de callback do Bling para este projeto deve apontar para a URL pública do site onde a função serverless foi implantada.

- URL correta (registre no painel do Bling):

  `https://smilepetshop.vercel.app/api/bling/callback`

  Observações:

  - A URL deve bater exatamente (https, domínio, sem barra extra no final no momento do registro se o painel pedir sem).
  - O Bling vai redirecionar para essa URL com query params (ex.: `?code=...&state=...`).

Passos para garantir que funcione:

1. Certifique-se de que o arquivo `api/bling/callback.js` foi comitado e está no branch que o Vercel usa para deploy.

2. Faça push e aguarde o deploy no Vercel. No dashboard do Vercel, confirme que o deployment está `Ready`.

3. Teste manualmente abrindo no navegador:

`https://smilepetshop.vercel.app/api/bling/callback?code=test&state=ok`

- Se você vir a página HTML com os parâmetros ou a mensagem de que os dados foram enviados (em caso de popup), a função está disponível.

4. No painel do Bling, altere o Redirect/Callback URL para `https://smilepetshop.vercel.app/api/bling/callback`.

5. Inicie o fluxo de autenticação (autenticar) no Bling e confirme que o redirecionamento não dá 404.

Se você precisar de uma solução temporária sem deploy de função, registre a rota do SPA (ex.: `https://smilepetshop.vercel.app/bling/callback`) e me peça para criar o componente React que lê os query params e faz postMessage para a janela que abriu o popup.

Se continuar com 404 após o deploy, cole aqui os passos que você fez e eu te guio para checar o deploy logs do Vercel.

---

Arquivo gerado automaticamente para referência.
