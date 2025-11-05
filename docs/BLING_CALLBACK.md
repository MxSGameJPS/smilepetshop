# Bling callback URL

O endpoint de callback do Bling para este projeto deve apontar para a URL pública do site onde a função serverless foi implantada.

- URL correta (registre no painel do Bling):

  `https://smilepetshop.vercel.app/api/bling/callback`

  Observações:

  - A URL deve bater exatamente (https, domínio, sem barra extra no final no momento do registro se o painel pedir sem).
  - O Bling vai redirecionar para essa URL com query params (ex.: `?code=...&state=...`).

  Variáveis de ambiente relevantes (definir no Vercel → Project → Settings → Environment Variables):

  - `BLING_CLIENT_ID` e `BLING_CLIENT_SECRET`: credenciais do aplicativo no Bling.
  - `BLING_PUBLIC_URL` _(opcional)_: URL base do site (ex.: `https://smilepetshop.vercel.app`). Se não informar, a função infere a partir dos headers.
  - `BLING_REDIRECT_URI` _(opcional)_: use se quiser forçar explicitamente a URL de callback. O padrão calculado é `${PUBLIC_URL}/api/bling/callback`.
  - `BLING_APP_CALLBACK_URL` _(opcional)_: rota do SPA que receberá o payload final. Padrão: `${PUBLIC_URL}/bling/callback`.

Passos para garantir que funcione:

1. Certifique-se de que o arquivo `api/bling/callback.js` foi comitado e está no branch que o Vercel usa para deploy.

1. Faça push e aguarde o deploy no Vercel. No dashboard do Vercel, confirme que o deployment está `Ready`.

1. Teste manualmente abrindo no navegador:

`https://smilepetshop.vercel.app/api/bling/callback?code=test&state=ok`

- Se você vir a página HTML com os parâmetros ou a mensagem de que os dados foram enviados (em caso de popup), a função está disponível.

1. No painel do Bling, altere o Redirect/Callback URL para `https://smilepetshop.vercel.app/api/bling/callback`.

1. Inicie o fluxo de autenticação (autenticar) no Bling e confirme que o redirecionamento não dá 404.

Se você precisar de uma solução temporária sem deploy de função, registre a rota do SPA (ex.: `https://smilepetshop.vercel.app/bling/callback`) e me peça para criar o componente React que lê os query params e faz postMessage para a janela que abriu o popup.

Se continuar com 404 após o deploy, cole aqui os passos que você fez e eu te guio para checar o deploy logs do Vercel.

---

Arquivo gerado automaticamente para referência.
