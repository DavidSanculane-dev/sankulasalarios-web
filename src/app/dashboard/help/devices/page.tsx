"use client";

import React, { useState } from "react";

type Brand = "hikvision" | "suprema" | "zkteco";

export default function DevicesHelpPage() {
  const [activeTab, setActiveTab] = useState<Brand>("hikvision");
  const serverDomain = "sankula-salarios.vercel.app";

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guia de Vinculação de Terminais</h1>
        <p className="text-sm text-slate-500 mt-1">
          Siga as instruções abaixo para configurar a comunicação em tempo real dos seus relógios de ponto com a plataforma.
        </p>
      </div>

      {/* Navegação por Separadores */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("hikvision")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "hikvision"
              ? "bg-sky-50 text-sky-700 shadow-xxs border border-sky-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          🌐 HikVision (ISAPI)
        </button>
        <button
          onClick={() => setActiveTab("suprema")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "suprema"
              ? "bg-amber-50 text-amber-700 shadow-xxs border border-amber-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          🔶 Suprema / BioStar 2
        </button>
        <button
          onClick={() => setActiveTab("zkteco")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "zkteco"
              ? "bg-emerald-50 text-emerald-700 shadow-xxs border border-emerald-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          ⚡ ZKTeco (ADMS/PUSH)
        </button>
      </div>

      {/* Caixa de Conteúdo */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                {/* ...Continuação da Parte 1 */}
        
        {/* ========================================== */}
        {/* GUIA HIKVISION                             */}
        {/* ========================================== */}
        {activeTab === "hikvision" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-xl">🛠️</span>
              <h2 className="text-lg font-bold text-slate-800">Configuração de Terminais HikVision / MinMoe</h2>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Os leitores faciais e biométricos HikVision comunicam através do protocolo ISAPI Linkage utilizando <span className="font-semibold text-slate-800">Multipart/Mixed HTTP Push</span>.
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Passo a Passo Físico:</h3>
              <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">
                <li>Abra o navegador e aceda ao endereço IP local do seu leitor HikVision.</li>
                <li>Inicie sessão com o utilizador <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono font-bold">admin</code> do equipamento.</li>
                <li>Navegue até ao menu superior <span className="font-medium text-slate-900">Configuration</span>.</li>
                <li>No menu lateral esquerdo, expanda <span className="font-medium text-slate-900">Network</span> e clique em <span className="font-medium text-slate-900">Advanced Settings</span>.</li>
                <li>Clique na aba <span className="font-medium text-slate-900">HTTP Listening</span> (ou <span className="font-medium text-slate-900">Event Transmission</span>).</li>
                <li>Ative a caixa de seleção <span className="font-semibold text-slate-800">Enable HTTP Data Transmission</span>.</li>
                <li>No campo <span className="font-semibold text-slate-800">Destination URL</span> (ou Host Address), introduza o seguinte endereço completo:</li>
              </ol>

              <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-sky-400 break-all select-all shadow-inner">
                https://{serverDomain}/api/webhooks/hikvision
              </div>

              <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2" start={8}>
                <li>Mude o tipo de dados para <span className="font-semibold text-slate-800">JSON</span> ou <span className="font-semibold text-slate-800">XML</span> se disponível.</li>
                <li>Clique em <span className="font-semibold text-slate-800">Save</span> e reinicie o equipamento se solicitado.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* GUIA SUPREMA                               */}
        {/* ========================================== */}
        {activeTab === "suprema" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-xl">⚙️</span>
              <h2 className="text-lg font-bold text-slate-800">Configuração Suprema / BioStar 2 Server</h2>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Para os equipamentos Suprema (como o <span className="font-semibold text-slate-800">BioStation 3</span>), a comunicação em tempo real é centralizada através dos gatilhos HTTP do painel de controlo do BioStar 2 local ou Cloud.
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Passo a Passo Físico:</h3>
              <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">
                <li>Aceda ao portal de gestão ou servidor local do seu software <span className="font-semibold text-slate-800">BioStar 2</span>.</li>
                <li>No menu superior ou lateral, clique em <span className="font-medium text-slate-900">Settings</span> e vá a <span className="font-medium text-slate-900">Trigger & Action</span>.</li>
                <li>Clique no botão <span className="font-semibold text-slate-800">Add Trigger & Action</span>.</li>
                <li>Na secção <span className="font-medium text-slate-900">Trigger</span>, configure o evento de gatilho para disparar a qualquer hora em caso de <span className="font-semibold text-slate-800">Device Auth Success</span>.</li>
                <li>Na secção <span className="font-medium text-slate-900">Action</span>, mude o tipo de resposta para <span className="font-semibold text-slate-800">HTTP/HTTPS POST Request</span>.</li>
                <li>No campo do URL de destino da ação, insira o URL público abaixo adicionando a sua chave de segurança:</li>
              </ol>

              <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-amber-400 break-all select-all shadow-inner">
                https://{serverDomain}/api/webhooks/biostation?secret=A_SUA_CRON_SECRET
              </div>

              <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2" start={7}>
                <li>Certifique-se de mapear as propriedades <code className="text-xs bg-slate-100 p-0.5 rounded">user_id</code> e <code className="text-xs bg-slate-100 p-0.5 rounded">device_id</code> no editor JSON.</li>
                <li>Clique em <span className="font-semibold text-slate-800">Apply</span> para propagar a escuta para os leitores Suprema.</li>
              </ol>
            </div>
          </div>
        )}
        

        {/* ========================================== */}
        {/* GUIA ZKTECO                                */}
        {/* ========================================== */}
        {activeTab === "zkteco" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-xl">⚡</span>
              <h2 className="text-lg font-bold text-slate-800">Configuração de Protocolo ADMS / PUSH (ZKTeco)</h2>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              Os relógios de ponto da ZKTeco (linhas iClock, KF, MB, VF e SpeedFace) utilizam o protocolo push nativo proprietário da marca denominado <span className="font-semibold text-slate-800">ADMS</span>.
            </p>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Passo a Passo Físico:</h3>
              <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">
                <li>No menu físico do ecrã do seu relógio ZKTeco, clique no botão <span className="font-semibold text-slate-800">M/OK</span> para abrir as definições.</li>
                <li>Navegue e selecione o ícone <span className="font-medium text-slate-900">Comunicações</span> (ou Rede) e clique em <span className="font-medium text-slate-900">Definições do Servidor Cloud</span>.</li>
                <li>Mude o modo do endereço do servidor de IP para <span className="font-semibold text-slate-800">Nome de Domínio</span> (Domain Name).</li>
                <li>No campo do Nome do Servidor, digite exatamente o endereço principal da Vercel (sem caminhos nem protocolo):</li>
              </ol>

              <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-emerald-400 break-all select-all shadow-inner text-center">
                {serverDomain}
              </div>

              <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2" start={5}>
                <li>Configure a Porta do Servidor para o valor <span className="font-semibold text-slate-800">443</span> (Porta encriptada obrigatória para Vercel SSL).</li>
                <li>Ative a opção <span className="font-semibold text-slate-800">Ativar HTTPS / SSL</span> caso o seu firmware o permita.</li>
                <li>Guarde as configurações, saia do menu e reinicie o relógio de ponto ZKTeco na ficha elétrica.</li>
              </ol>
            </div>
          </div>
        )}

      </div> {/* Fecha o bloco de conteúdo dinâmico */}

      {/* Alerta de Validação de Rodapé */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3 items-start shadow-xxs">
        <span className="text-lg">📢</span>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Passo Final de Vinculação:</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Após configurar o equipamento físico, lembre-se de registar o <span className="font-semibold text-slate-800">Número de Série (SN)</span> exato do aparelho no ecrã de <span className="font-medium text-slate-900">Terminais Biométricos</span> deste painel. Sem o registo prévio do número de série do leitor na base de dados, a plataforma rejeitará todas as picagens recebidas por segurança.
          </p>
        </div>
      </div>

    </div>
  );
}

        

