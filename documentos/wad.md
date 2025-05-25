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

No contexto da arquitetura Model-View-Controller (MVC), os Models (Modelos) são a camada responsável por gerenciar os dados da aplicação, a lógica de negócios e as regras de manipulação desses dados. Eles representam a estrutura do domínio do problema, ou seja, as entidades e como elas se relacionam, além de serem a ponte de comunicação com o sistema de persistência (o banco de dados).


O projeto utiliza os seguintes modelos de dados, cada um correspondendo a uma tabela no banco de dados e representando uma entidade fundamental do sistema financeiro pessoal:

1. Modelo: Usuário (usuarios)
Este modelo encapsula todas as informações relativas a um usuário individual da aplicação. Ele é a base para a autenticação, autorização e para garantir que os dados sejam segregados e pertencentes apenas ao seu respectivo proprietário.

Atributos:
`id`: Identificador único e primário para cada usuário, gerado automaticamente.
nome: Nome completo do usuário.
`email`: Endereço de e-mail exclusivo do usuário, utilizado para login e identificação.
`senha`: Senha do usuário (armazenada de forma segura, como um hash).
`criado_em`: Timestamp da criação do registro do usuário.

2. Modelo: Categoria (categorias)
O modelo de Categoria permite aos usuários classificar e organizar suas transações financeiras. Por exemplo, um usuário pode ter categorias como "Alimentação", "Transporte", "Moradia", etc.

Atributos:
`id`: Identificador único e primário para cada categoria.
`nome`: Nome descritivo da categoria.
`usuario_id`: Chave estrangeira que vincula a categoria a um Usuário específico, garantindo que cada usuário tenha suas próprias categorias personalizadas.

3. Modelo: Conta (contas)
Este modelo representa as diferentes fontes ou destinos de dinheiro que um usuário pode possuir, como contas bancárias, carteiras digitais ou cartões de crédito. Ele gerencia o saldo de cada uma dessas contas.

Atributos:
`id`: Identificador único e primário para cada conta.
`nome`: Nome que identifica a conta (ex: "NuConta", "Carteira", "Banco do Brasil").
`saldo`: O valor monetário atual disponível na conta.
`usuario_id`: Chave estrangeira que associa a conta a um Usuário específico.

4. Modelo: Transação (transacoes)
O modelo de Transação é o cerne do registro financeiro, representando cada entrada ou saída de dinheiro. Cada transação é detalhada, categorizada e ligada a uma conta específica.

Atributos:
`id`: Identificador único e primário para cada transação.
descricao: Uma breve descrição do que a transação representa.
`valor`: O valor monetário da transação.
tipo: Indica se a transação é uma receita ou uma despesa.
`data`: Timestamp da ocorrência ou registro da transação.
`usuario_id`: Chave estrangeira que vincula a transação a um Usuário específico.
`categoria_id`: Chave estrangeira que associa a transação a uma Categoria.
`conta_id`: Chave estrangeira que liga a transação a uma Conta.
`criado_em`: Timestamp da criação do registro da transação.
`atualizado_em`: Timestamp da última modificação do registro da transação.
### 3.2. Arquitetura 

O Diagrama MVC é uma representação visual da arquitetura Model-View-Controller (MVC), um padrão de design de software amplamente utilizado no desenvolvimento de aplicações, especialmente as web. Seu principal objetivo é separar as responsabilidades de uma aplicação em três componentes interconectados, facilitando a organização do código, a manutenção, a escalabilidade e o desenvolvimento colaborativo.
<img src="../assets/diagrama.png" width="100%">

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