-- ============================================================
-- ACS-Expert — Schema MySQL v2
-- Executar no banco já criado (railway / acs_expert)
-- ============================================================

-- ------------------------------------------------------------
-- MUNICÍPIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,
  uf            CHAR(2)      NOT NULL,
  codigo_ibge   CHAR(7)      UNIQUE,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- MICROÁREAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS microareas (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  municipio_id    INT UNSIGNED NOT NULL,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_microarea_municipio
    FOREIGN KEY (municipio_id) REFERENCES municipios(id)
);

-- ------------------------------------------------------------
-- UNIDADES DE SAÚDE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unidades_saude (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(200) NOT NULL,
  tipo         ENUM('ubs','caps','hospital','laboratorio','outro') DEFAULT 'ubs',
  endereco     VARCHAR(300),
  municipio_id INT UNSIGNED NOT NULL,
  latitude     DECIMAL(10,8),
  longitude    DECIMAL(11,8),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_unidade_municipio
    FOREIGN KEY (municipio_id) REFERENCES municipios(id)
);

-- ------------------------------------------------------------
-- USUÁRIOS (ACS, coordenadores, gestores)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(200) NOT NULL,
  matricula     VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(200) UNIQUE,
  senha_hash    VARCHAR(255) NOT NULL,
  perfil        ENUM('acs','coordenador','gestor') DEFAULT 'acs',
  microarea_id  INT UNSIGNED,
  municipio_id  INT UNSIGNED NOT NULL,
  ativo         TINYINT(1)   DEFAULT 1,
  ultimo_acesso DATETIME,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_microarea
    FOREIGN KEY (microarea_id) REFERENCES microareas(id),
  CONSTRAINT fk_usuario_municipio
    FOREIGN KEY (municipio_id) REFERENCES municipios(id)
);

-- ------------------------------------------------------------
-- DOMICÍLIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domicilios (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_referencia   VARCHAR(200),
  logradouro        VARCHAR(300) NOT NULL,
  numero            VARCHAR(20),
  complemento       VARCHAR(100),
  bairro            VARCHAR(150),
  cep               CHAR(8),
  microarea_id      INT UNSIGNED,
  latitude          DECIMAL(10,8),
  longitude         DECIMAL(11,8),
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_domicilio_microarea
    FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

-- ------------------------------------------------------------
-- PACIENTES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome                      VARCHAR(200) NOT NULL,
  cpf                       CHAR(11)     UNIQUE,
  cns                       VARCHAR(15)  UNIQUE,
  identificador_municipal   VARCHAR(50),
  data_nascimento           DATE         NOT NULL,
  sexo                      ENUM('m','f') NOT NULL,
  domicilio_id              INT UNSIGNED,
  responsavel_domicilio     TINYINT(1)   DEFAULT 0,
  acs_responsavel_id        INT UNSIGNED,
  idoso_mora_sozinho        TINYINT(1)   DEFAULT 0,
  vulnerabilidade_social    TINYINT(1)   DEFAULT 0,
  dificuldade_locomocao     TINYINT(1)   DEFAULT 0,
  beneficio_social          TINYINT(1)   DEFAULT 0,
  score_risco_atual         DECIMAL(5,2) DEFAULT 0,
  nivel_risco               ENUM('baixo','moderado','alto') DEFAULT 'baixo',
  data_ultima_triagem       DATETIME,
  data_ultima_visita        DATETIME,
  ativo                     TINYINT(1)   DEFAULT 1,
  created_at                DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_paciente_domicilio
    FOREIGN KEY (domicilio_id) REFERENCES domicilios(id),
  CONSTRAINT fk_paciente_acs
    FOREIGN KEY (acs_responsavel_id) REFERENCES usuarios(id),
  INDEX idx_paciente_cpf (cpf),
  INDEX idx_paciente_cns (cns),
  INDEX idx_paciente_risco (nivel_risco),
  INDEX idx_paciente_acs (acs_responsavel_id)
);

-- ------------------------------------------------------------
-- COMORBIDADES DO PACIENTE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paciente_comorbidades (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id  INT UNSIGNED NOT NULL,
  comorbidade  ENUM(
    'fumante','hipertenso','diabetico','obeso',
    'asmatico','gestante','cardiopata','dpoc','imunossuprimido'
  ) NOT NULL,
  data_registro DATE,
  UNIQUE KEY uq_paciente_comorbidade (paciente_id, comorbidade),
  CONSTRAINT fk_comorbidade_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- VISITAS DOMICILIARES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitas (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id    INT UNSIGNED NOT NULL,
  acs_id         INT UNSIGNED NOT NULL,
  data_hora      DATETIME     NOT NULL,
  tipo_visita    ENUM('rotina','busca_ativa','retorno','urgencia') DEFAULT 'rotina',
  status         ENUM('planejada','realizada','cancelada','remarcada') DEFAULT 'planejada',
  observacao     TEXT,
  flags          JSON,
  offline_uuid   CHAR(36),
  synced_at      DATETIME,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_visita_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_visita_acs
    FOREIGN KEY (acs_id) REFERENCES usuarios(id),
  INDEX idx_visita_paciente (paciente_id),
  INDEX idx_visita_acs_data (acs_id, data_hora)
);

-- ------------------------------------------------------------
-- TRIAGENS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS triagens (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visita_id           INT UNSIGNED,
  paciente_id         INT UNSIGNED NOT NULL,
  acs_id              INT UNSIGNED NOT NULL,
  data_hora           DATETIME     NOT NULL,
  faixa_etaria        VARCHAR(10)  NOT NULL,
  sexo                ENUM('m','f') NOT NULL,
  score_final         DECIMAL(5,2) NOT NULL,
  nivel_risco         ENUM('baixo','moderado','alto') NOT NULL,
  nivel_prioridade    ENUM('muito_baixa','baixa','media','alta') NOT NULL,
  acao_recomendada    ENUM('acompanhamento','encaminhar_ubs','urgencia') NOT NULL,
  top_doenca_id       VARCHAR(50),
  top_doenca_nome     VARCHAR(150),
  top_doenca_score    DECIMAL(5,2),
  payload_sintomas    JSON NOT NULL,
  payload_resultado   JSON NOT NULL,
  offline_uuid        CHAR(36),
  synced_at           DATETIME,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_triagem_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_triagem_acs
    FOREIGN KEY (acs_id) REFERENCES usuarios(id),
  CONSTRAINT fk_triagem_visita
    FOREIGN KEY (visita_id) REFERENCES visitas(id),
  INDEX idx_triagem_paciente (paciente_id),
  INDEX idx_triagem_data (data_hora),
  INDEX idx_triagem_risco (nivel_risco)
);

-- ------------------------------------------------------------
-- SINTOMAS REGISTRADOS POR TRIAGEM
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS triagem_sintomas (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  triagem_id   INT UNSIGNED NOT NULL,
  sintoma_id   VARCHAR(50)  NOT NULL,
  intensidade  TINYINT      NOT NULL DEFAULT 5,
  qualificadores JSON,
  CONSTRAINT fk_tsintoma_triagem
    FOREIGN KEY (triagem_id) REFERENCES triagens(id) ON DELETE CASCADE,
  INDEX idx_tsintoma_triagem (triagem_id),
  INDEX idx_tsintoma_sintoma (sintoma_id)
);

-- ------------------------------------------------------------
-- RESULTADOS CALCULADOS POR TRIAGEM
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS triagem_resultados (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  triagem_id   INT UNSIGNED NOT NULL,
  doenca_id    VARCHAR(50)  NOT NULL,
  doenca_nome  VARCHAR(150) NOT NULL,
  score        DECIMAL(5,2) NOT NULL,
  label        ENUM('Alta','Media','Baixa') NOT NULL,
  rank_posicao TINYINT      NOT NULL,
  CONSTRAINT fk_tresultado_triagem
    FOREIGN KEY (triagem_id) REFERENCES triagens(id) ON DELETE CASCADE,
  INDEX idx_tresultado_triagem (triagem_id)
);

-- ------------------------------------------------------------
-- ENCAMINHAMENTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encaminhamentos (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  triagem_id          INT UNSIGNED,
  paciente_id         INT UNSIGNED NOT NULL,
  acs_id              INT UNSIGNED NOT NULL,
  tipo                ENUM(
    'consulta_medica','enfermagem','vacinacao',
    'exame','urgencia','especialista'
  ) NOT NULL,
  motivo              TEXT NOT NULL,
  unidade_saude_id    INT UNSIGNED,
  data_encaminhamento DATETIME NOT NULL,
  data_prevista       DATE,
  status              ENUM('pendente','realizado','ausencia','cancelado') DEFAULT 'pendente',
  data_desfecho       DATETIME,
  observacao_desfecho TEXT,
  notificar_ausencia  TINYINT(1)   DEFAULT 1,
  alerta_gerado       TINYINT(1)   DEFAULT 0,
  offline_uuid        CHAR(36),
  synced_at           DATETIME,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_encam_triagem
    FOREIGN KEY (triagem_id) REFERENCES triagens(id),
  CONSTRAINT fk_encam_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_encam_acs
    FOREIGN KEY (acs_id) REFERENCES usuarios(id),
  CONSTRAINT fk_encam_unidade
    FOREIGN KEY (unidade_saude_id) REFERENCES unidades_saude(id),
  INDEX idx_encam_paciente (paciente_id),
  INDEX idx_encam_status (status),
  INDEX idx_encam_acs (acs_id)
);

-- ------------------------------------------------------------
-- ALERTAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id    INT UNSIGNED,
  acs_id         INT UNSIGNED NOT NULL,
  tipo           ENUM(
    'alto_risco_sem_visita',
    'encaminhamento_pendente',
    'encaminhamento_ausencia',
    'cronico_sem_acompanhamento',
    'gestante_sem_prenatal',
    'vacina_atrasada',
    'familia_multiplo_risco',
    'novo_encaminhamento'
  ) NOT NULL,
  urgencia       ENUM('informativo','atencao','urgente') DEFAULT 'atencao',
  titulo         VARCHAR(200) NOT NULL,
  mensagem       TEXT,
  resolvido      TINYINT(1)   DEFAULT 0,
  data_resolucao DATETIME,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerta_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_alerta_acs
    FOREIGN KEY (acs_id) REFERENCES usuarios(id),
  INDEX idx_alerta_acs (acs_id, resolvido),
  INDEX idx_alerta_urgencia (urgencia, resolvido)
);

-- ------------------------------------------------------------
-- AGENDA DE VISITAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agenda_visitas (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  acs_id           INT UNSIGNED NOT NULL,
  paciente_id      INT UNSIGNED NOT NULL,
  data_agenda      DATE         NOT NULL,
  ordem_prioridade SMALLINT     NOT NULL,
  score_prioridade DECIMAL(6,2) NOT NULL,
  motivo_prioridade JSON,
  status           ENUM('pendente','realizada','adiada','cancelada') DEFAULT 'pendente',
  visita_id        INT UNSIGNED,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_agenda (acs_id, paciente_id, data_agenda),
  CONSTRAINT fk_agenda_acs
    FOREIGN KEY (acs_id) REFERENCES usuarios(id),
  CONSTRAINT fk_agenda_paciente
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_agenda_visita
    FOREIGN KEY (visita_id) REFERENCES visitas(id),
  INDEX idx_agenda_acs_data (acs_id, data_agenda)
);

-- ------------------------------------------------------------
-- REFRESH TOKENS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expira_em   DATETIME     NOT NULL,
  revogado    TINYINT(1)   DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rtoken_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_rtoken (token, revogado)
);
