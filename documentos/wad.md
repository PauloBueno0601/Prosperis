# Web Application Document - Projeto Individual - Módulo 2 - Inteli



## Prosperis

#### Autor do projeto

Paulo Henrique Bueno Fernandes

## Sumário

1. [Introdução](#c1)  
2. [Visão Geral da Aplicação Web](#c2)  
3. [Projeto Técnico da Aplicação Web](#c3)  
4. [Desenvolvimento da Aplicação Web](#c4)  
5. [Referências](#c5)  

<br>

## <a name="c1"></a>1. Introdução 
 
 Em um mundo onde a organização financeira pessoal é cada vez mais essencial para alcançar estabilidade e prosperidade, torna-se fundamental dispor de ferramentas que permitam gerenciar com clareza as receitas, despesas e o saldo disponível. O projeto Prosperis tem como objetivo o desenvolvimento de um sistema de controle financeiro que auxilie os usuários a monitorarem suas transações, organizarem seus gastos por categorias, acompanharem múltiplas contas e visualizarem relatórios interativos, promovendo uma gestão eficiente e acessível.

A aplicação foi projetada para ser intuitiva, segura e funcional, contando com autenticação robusta e permitindo que cada usuário tenha uma visão clara e detalhada de sua situação financeira, otimizando a organização de gastos e finanças pessoais. A estrutura do sistema é baseada em um modelo relacional robusto, que armazena informações sobre usuários, contas, categorias e transações, garantindo integridade dos dados, segurança e flexibilidade para consultas, análises e relatórios futuros.

Por meio da aplicação Prosperis, espera-se promover a educação financeira, incentivar o planejamento pessoal, facilitar a tomada de decisões baseadas em dados reais e atualizados, e inspirar os usuários a construírem uma relação saudável com o dinheiro, rumo a uma vida financeira mais próspera e equilibrada.

## <a name="c2"></a>2. Visão Geral da Aplicação Web

### 2.1. Personas (Semana 01)

*Posicione aqui sua(s) Persona(s) em forma de texto markdown com imagens, ou como imagem de template preenchido. Atualize esta seção ao longo do módulo se necessário.*

### 2.2. User Stories (Semana 01)

*Posicione aqui a lista de User Stories levantadas para o projeto. Siga o template de User Stories e utilize a referência USXX para numeração (US01, US02, US03, ...). Indique todas as User Stories mapeadas, mesmo aquelas que não forem implementadas ao longo do projeto. Não se esqueça de explicar o INVEST de 1 User Storie prioritária.*

---

## <a name="c3"></a>3. Projeto da Aplicação Web

### 3.1. Modelagem do banco de dados  

&emsp; A modelagem de banco de dados é uma etapa fundamental no desenvolvimento de sistemas de informação, sendo o processo de projetar a estrutura lógica e física que organizará os dados de forma eficiente e segura. Este processo envolve a identificação das entidades principais, a definição de seus atributos e a criação de relacionamentos entre elas, utilizando ferramentas como diagramas entidade-relacionamento (DER) e notações como chaves primárias (PK) e estrangeiras (FK). Um modelo bem elaborado garante integridade, escalabilidade e facilidade de manutenção, permitindo consultas complexas e análises precisas.

#### Modelo Relacional

&emsp; O modelo relacional é uma estrutura para gerenciamento de bancos de dados que organiza informações em tabelas interconectadas. Cada tabela contém linhas e colunas, representando registros e atributos, respectivamente. Usando chaves primárias e estrangeiras, ele assegura relacionamentos lógicos, facilitando consultas e mantendo a integridade dos dados.

<div align="center">
<figcaption><strong>Figura 1 - Modelo Lógico do Banco de Dados</strong></figcaption>
<br>
<img src="../assets/Banco de Dados/modelo-banco.png" width="100%">
<br>
<em>Fonte: Material produzido pelo autor (2025)</em>
</div>

##### Identificar as Entidades Principais

As entidades principais do sistema, são:

- Usuarios: Representa os usuários do sistema.
- Categorias: Representa categorias para organizar transações (ex.: "alimentação", "transporte").
- Contas: Representa as contas financeiras dos usuários (ex.: conta bancária, carteira).
- Transacoes: Representa as transações financeiras realizadas.


#####  Definir os Campos de Cada Entidade
Com base na imagem, os campos de cada tabela (entidade) são:

Usuarios:
- id (integer, PK): Identificador único do usuário.
- email (text): Email do usuário.
- senha (text): Senha do usuário.
- criado_em (datetime): Data de criação do registro.

Categorias:

- id (integer, PK): Identificador único da categoria.
- nome (text): Nome da categoria.
- usuario_id (integer, FK): Referência ao usuário que criou a categoria.

Contas:
- id (integer, PK): Identificador único da conta.
- nome (text): Nome da conta.
- saldo (real): Saldo atual da conta.
- usuario_id (integer, FK): Referência ao usuário dono da conta.

Transacoes:

- id (integer, PK): Identificador único da transação.
- descricao (text): Descrição da transação.
- valor (real): Valor da transação.
- tipo (text): Tipo da transação (ex.: "receita", "despesa").
- data (datetime): Data da transação.
- usuario_id (integer, FK): Referência ao usuário que realizou a transação.
- categoria_id (integer, FK): Referência à categoria da transação.
- conta_id (integer, FK): Referência à conta associada à transação.

##### Relações:

Um usuário (1:N) pode ter várias categorias, contas e transações.
Uma categoria (1:N) pode estar associada a várias transações.
Uma conta (1:N) pode ter várias transações. As chaves estrangeiras garantem a integridade dos relacionamentos entre as tabelas.


#### Modelo Fisíco

&emsp; O modelo físico é essencial para planejar a estrutura do banco de dados que suportará a aplicação, garantindo que os dados sejam armazenados de forma eficiente, segura e consistente.
[Acesse o modelo físico da plataforma Prosperis (init.sql)](../scripts/init.sql)


```sql
-- init.sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);


CREATE TABLE contas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    saldo REAL NOT NULL,
    usuario_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    tipo TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    conta_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE
);
```


### 3.1.1 BD e Models (Semana 5)
*Descreva aqui os Models implementados no sistema web*

### 3.2. Arquitetura (Semana 5)

*Posicione aqui o diagrama de arquitetura da sua solução de aplicação web. Atualize sempre que necessário.*

**Instruções para criação do diagrama de arquitetura**  
- **Model**: A camada que lida com a lógica de negócios e interage com o banco de dados.
- **View**: A camada responsável pela interface de usuário.
- **Controller**: A camada que recebe as requisições, processa as ações e atualiza o modelo e a visualização.
  
*Adicione as setas e explicações sobre como os dados fluem entre o Model, Controller e View.*

### 3.3. Wireframes (Semana 03)

*Posicione aqui as imagens do wireframe construído para sua solução e, opcionalmente, o link para acesso (mantenha o link sempre público para visualização).*

### 3.4. Guia de estilos (Semana 05)

*Descreva aqui orientações gerais para o leitor sobre como utilizar os componentes do guia de estilos de sua solução.*


### 3.5. Protótipo de alta fidelidade (Semana 05)

*Posicione aqui algumas imagens demonstrativas de seu protótipo de alta fidelidade e o link para acesso ao protótipo completo (mantenha o link sempre público para visualização).*

### 3.6. WebAPI e endpoints (Semana 05)

*Utilize um link para outra página de documentação contendo a descrição completa de cada endpoint. Ou descreva aqui cada endpoint criado para seu sistema.*  

### 3.7 Interface e Navegação (Semana 07)

*Descreva e ilustre aqui o desenvolvimento do frontend do sistema web, explicando brevemente o que foi entregue em termos de código e sistema. Utilize prints de tela para ilustrar.*

---

## <a name="c4"></a>4. Desenvolvimento da Aplicação Web (Semana 8)

### 4.1 Demonstração do Sistema Web (Semana 8)

*VIDEO: Insira o link do vídeo demonstrativo nesta seção*
*Descreva e ilustre aqui o desenvolvimento do sistema web completo, explicando brevemente o que foi entregue em termos de código e sistema. Utilize prints de tela para ilustrar.*

### 4.2 Conclusões e Trabalhos Futuros (Semana 8)

*Indique pontos fortes e pontos a melhorar de maneira geral.*
*Relacione também quaisquer outras ideias que você tenha para melhorias futuras.*



## <a name="c5"></a>5. Referências

_Incluir as principais referências de seu projeto, para que seu parceiro possa consultar caso ele se interessar em aprofundar. Um exemplo de referência de livro e de site:_<br>

---
---