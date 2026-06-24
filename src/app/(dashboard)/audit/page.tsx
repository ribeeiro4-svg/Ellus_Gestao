'use client'
import React, { useMemo } from 'react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { restoreAssociateConfigsAction } from '@/app/actions/recovery_data'

const USUARIO_LIST = [
  "Andressa Ariadeny Marques Granja", "Cideijane Henrique Belo", "Hosana Maia Neves", "Teresinha Alves Pereira De Souza",
  "Taís Dos Santos Rodrigues", "Walquiana Santos", "Thiara Ferreira Dos Santos", "Tatiane Amaral Magalhães",
  "Rose France Cardoso Barros", "Maria Do Socorro Da Silva", "Lidiane Costa Lima", "João Paulo Freire Muniz De Vasconcelos",
  "Isodete Rodrigues Dos Santos Amorim", "Ingrid Luana Nascimento Santana", "Arthur Laurentino De Sá",
  "Ana Patricia Gadelha Da Costa Silva", "Manoel Martins Da Silva", "Glaucianne Cavalcante Da Conceição",
  "Marco Vinícius Silva Dantas", "Sérgio Modesto De Miranda", "Silmara Doralice Alves Mascarenhas",
  "Yasmin Amorim Lima", "Vitória Caroline Da Silva Reis", "Targieli Dos Santos Soares", "Roniel Feitosa",
  "Rodrigo Canau Da Silva Santos", "Rayane Barbosa De Souza", "Raphaella Monteiro Da Silva",
  "Rahyane Crys Pereira De Carvalho", "Poliana Lopes Feitosa", "Pablo Kayque Silva Pereira Santana",
  "Nadyelle Patricia Barros Santos", "Michelle Almeida Rodrigues", "Maycon Gleydson Bernardes De Lima",
  "Maria Juscileia Silva Campos", "Maria De Lourdes Rosa Dos Santos", "Luis Fellipe Melo Neto",
  "Lauro Gonzaga Da Silva", "Karmelyenne Pereira Da Silva", "Kananda Gomes Duarte", "Jenifer Santos Ribeiro",
  "Illana Do Nascimento Souza", "Hildeberto Maia Da Silva Neto", "Helena Maria Rodrigues", "Helber Passos Ferreira",
  "Gleiciane Pereira Da Silva", "Gleice Kelly De Jesus", "Gessica Nunes Dias", "Geraldo Monteiro De Assis",
  "Fernanda Andréia Da Silva", "Érica Sabrina Ferreira Da Silva", "Brenda Gonçalves Costa", "Aurenice Alves Da Silva",
  "Antonio Correia De Araújo Filho", "Anna Karoliny Duarte Cardoso Tavares", "Amanda Kelly Sousa Albuquerque",
  "Alexsandra Pereira De Oliveira", "Weyde Estefany", "Ana Maria Gomes De Andrade", "Roziane Siqueira Costa Granja",
  "Patrícia Ferreira Dos Santos Moura", "Geneilda Da Silva Barbosa", "Fernandoalex_as@hotmail.com",
  "Fernanda Albuquerque", "Fabiana Brito Amorim", "Erica Da Silva Guedes", "Danila Almeida Freire",
  "Cicera Pereira Calixto", "Beatryce Fernandes De Souza Ribeiro", "Andrea Maria Da Silva",
  "Anderson Claiton Barbosa Almino De Lima", "Amanda Jamilly Rodrigues Martins", "Ariel Soares De Melo",
  "Helena Yasmin Santos Ferreira", "Uara Karoline Pereira Silva", "Daiane Silva Barbosa",
  "Francileide De Carvalho Silva", "João Pedro De Oliveira Nobre Gabriel De Jesus", "Ananias Souza Nery",
  "Edson Carlos Gomes De Oliveira", "Marconi Almino De Lima", "Cícero Adson Barbosa Almino De Lima",
  "José Danilo Cavalcante", "Helana Murielle Da Silva", "Stefany Suany Pereira Macedo", "Emily Ellen Lima Santos",
  "Debora Prisciliane Da Silva Souza", "Jaqueline Caroline Cordeiro", "Maria José Menezes Da Silva",
  "Carlos Manoel Viana Evangelista", "Maria Regina Galvão Dias", "Maria Edleide Pereira Do Nascimento",
  "Wanielly Fabryne De Araújo Gomes", "Sâmela Deise De Pinho Gonçalves", "Luandson De Macedo Araújo",
  "Joseane Rodrigues Pereira", "Matheus Medrado Duarte", "Marina Oliveira De Menezes", "Mariana Nunes Macedo",
  "Jucileide Dayana Silva", "Maria Do Socorro Rodrigues De Sousa", "Maria Aparecida Silva Dos Santos",
  "Maria Auxiliadora César Loiola", "Geralda Alice Do Nascimento De Souza Leão", "Jair Alencar",
  "Roberta Muniz Da Silva", "Rute Mariah", "Severino Ramos Soares Gomes", "Valeria Medrado Duarte",
  "Mirelly Dos Santos", "Erica Raissa", "Ueldijane Lima De Souza", "Rosikelly Pereira De Souza",
  "Gilmar Damião De Queiroz", "Erikson Erick Cruz Da Silva", "Elissandra Micaela Do Nascimento Souza",
  "Michelly Elen Leal Menezes Torres", "Narciso Macedo Cavalcante", "Wilmara Rodrigues De Queiroz",
  "Evellyn Thainá Ramos Cardoso", "Francidalva Alencar Dos Santos", "Pedro Lucas De Souza Nascimento",
  "Eliana Josefa Sales", "Elayne Lima Meira", "Elane Alencar Lima Da Silva", "Deuzanira De Sousa Silva",
  "David Wilson Dourado Silva", "Daniela Fernandes Rodrigues", "Bruna Ferreira De Souza", "Brena Almeida",
  "Auriane Oliveira", "André De Morais Santos Fernandes", "Yarla Fernanda", "Ângela Nayara Santos De Araújo",
  "Ismar Evangelista Dos Santos", "Pablo Gustavo Silva Feitoza", "Luciana Santos Ribeiro Alves",
  "Lucimara Aparecida Nunes Da Silva", "Manoel Olegario Alves Da Silva", "Maria Elizangela Ferreira Dos Santos",
  "Kerley Helena De Lira Ferreira Dos Santos", "Messias Genelicio De Almeida", "Shirlene Lopes Da Silva",
  "Synnara Cruz Vasconcelos", "Luciane Silva Oliveira Nunes", "Emanuela Messias Da Silva",
  "Lêdyoneide Matias Da Silva", "Claudivania Benicia Da Silva", "Débora Nascimento Da Silva Costa",
  "Leonor Campos Lima", "Eduardo Liborio Da Mota", "Rognon Antônio Da Silva", "Aretha De Oliveira Dias Da Silva",
  "Giovanna Souza Silva", "Henrique Bruno Dos Santos Lima", "Keila Márcia De Oliveira", "Luis Felipe Guimarães Silva",
  "Dourival Evangelista Duarte", "Graziela Feitoza Da Silva", "Caio Gabriel Libório Cabral", "Eliene Lustoza Rodrigues",
  "Antonio Senir Dos Santos", "Francimar Menezes De Souza", "Maria Delcelene Lima Da Silva",
  "Camila Michely Delmonde Da Silva", "Emilene Cavalcante Da Cruz", "Cândido Augusto Pires Alves Holanda",
  "Ana Beatriz Dos Santos Barbosa Barros", "Almerinda Ribeiro Miroro", "Lavínia Suely Silva Ribeiro",
  "Francisco Leônidas Maciel Lopes", "Wanessa Nunes Barros", "Maria Nelly Nunes Cavalcante",
  "Gildenor Rodrigues De Sena", "Joelma Farias Dos Santos Menezes", "Carolinne Cavalcante De Carvalho Martins",
  "Ângela Maria Vieira Dos Santos", "Lucas Paixao Santos", "Maria Do Rosário Medeiros Ramos",
  "Marla Mirele Santos Souza Alencar", "Ana Beatriz Medeiros Ramos", "Stefany Bernardo Dos Santos",
  "Yasmin Neci Rodrigues Cavalcanti", "Vitória Berben Sobreira", "Maria Jose Meneses Da Silva",
  "Maria Helena Pereira", "Maria Greicia Vieira Dos Santos Braga", "Maria Dos Remédios Lacerda Coelho",
  "Janaina Teotônio Passos", "Maria Clara Soares Matos", "Jorgina Celina Dos Santos", "Renato Gomes Ferraz",
  "Joselita Maria Ribeiro", "Mateus Galvão De Souza", "Maria Neliane Coelho Gomes", "Maria Gabrielly Santos Soares",
  "Maria Edna Fernandes Furtado", "Jaime Belarmino Gomes De Azevedo", "Flávia Rodrigues De Sena",
  "Larissa Carvalho Da Costa", "José Neves De Freitas", "Jacilene Juscilene Rodrigues",
  "Flávia Alves S. Nunes Nogueira", "Élida Cristina Barroso Cruz", "Blenda Francilda Silva Do Carmo Oliveira",
  "Natalia Patrícia Silva Lima", "Ruamma Granja Bezerra", "Givaldo Evangelista Pateiro",
  "Ingrid Luana Dos Santos Carvalho", "Valdecino Alves Rodrigues", "Geisiane De Oliveira Silva",
  "Gilvan Araújo Ribeiro", "Yrllana Magalhaes Gomes De Almeida", "Naiara Batista Dos Santos",
  "Cristiane Ribeiro Da Silva", "Andressa Dos Santos Souza Castro", "Amarildo Ferreira Gomes",
  "Alane Gonçalves Nascimento Da Silva", "Cinthia Rejane Da Silva Pereira Rocha"
]

export default function AuditPage() {
  const { associados, loading, syncZapSign, refresh, sb } = useAssociados()
  const [fixing, setFixing] = React.useState(false)

  const handleFixOrphans = async () => {
    setFixing(true)
    try {
      const { data: lancamentos } = await sb.from('lancamentos')
        .select('*')
        .eq('status', 'pago')
        .is('associado_id', null)
      
      if (!lancamentos || lancamentos.length === 0) {
        alert('Nenhum lançamento órfão encontrado.')
        return
      }

      let count = 0
      for (const l of lancamentos) {
        // Tenta extrair o nome da descrição "MENSALIDADE - NOME"
        const parts = l.descricao.split(' - ')
        if (parts.length < 2) continue
        
        const nomeAlvo = parts[1].trim()
        const match = associados.find(a => a.nome.trim().toLowerCase() === nomeAlvo.toLowerCase())
        
        if (match) {
          await sb.from('lancamentos')
            .update({ associado_id: match.id })
            .eq('id', l.id)
          count++
        }
      }
      alert(`Sucesso! ${count} lançamentos foram re-vinculados aos seus associados.`)
      refresh()
    } catch (err) {
      console.error(err)
      alert('Erro ao processar recuperação.')
    } finally {
      setFixing(false)
    }
  }

  const handleRestoreConfigs = async () => {
    if (!confirm('Deseja restaurar as configurações de recorrência e Cora PJ para os associados da lista?')) return
    
    setFixing(true)
    try {
      const RAW_DATA = `
Alane Gonçalves Nascimento da Silva		salane443@gmail.com	87991824645	10	50	ATIVO	SIM	CORA PJ
ALEXSANDRA PEREIRA DE OLIVEIRA	05220789406	alpoliveiraepcdda@gmail.com	87996455661	10	50	ATIVO	SIM	CORA PJ
Almerinda Ribeiro Miroro		meryriboo@gmail.com	87988386019	10	50	ATIVO	SIM	CORA PJ
Amanda Freitas		freeitasamandaa2@gmail.com	87991750093	10	50	ATIVO	SIM	CORA PJ
Amanda Jamilly Rodrigues Martins	11206650435	amandajamillyrodrigues@hotmail.com	87988294535	10	50	ATIVO	SIM	
Amanda Kelly Sousa Albuquerque	71696035430	amandasampaoli@gmail.com	87988560550	10	50	ATIVO	SIM	CORA PJ
Amarildo ferreira Gomes		trilhacrf20000@gmail.com	74999361362	10	50	ATIVO	SIM	CORA PJ
Ana Beatriz dos Santos Barbosa Barros		beatrizpatrulheiro@gmail.com	87981069886	10	50	ATIVO	SIM	CORA PJ
Ana Beatriz Medeiros Ramos		abmramos18@gmail.com	74999695457	10	50	ATIVO	SIM	CORA PJ
Ana Maria Gomes de Andrade		andersonamorim98529@gmail.com	87999653826	10	50	ATIVO	SIM	CORA PJ
ANA PATRICIA GADELHA DA COSTA SILVA	60565454587	ana.pgsilva@professor.educacao.pe.gov.br	87991219371	10	50	ATIVO	SIM	CORA PJ
Ananias Souza Nery		sneuzanery@yahoo.com	87988239317	10	50	ATIVO	SIM	CORA PJ
Anderson Claiton Barbosa Almino de Lima	06611593535	anderson.lima47@hotmail.com	87981052940	10	50	ATIVO	SIM	
André de Morais Santos Fernandes		andre.msf73@gmail.com	87988279413	10	50	ATIVO	SIM	CORA PJ
Andrea Maria da Silva	02425809473	andreasilvadvogada@gmail.com	87999514223	10	50	ATIVO	SIM	CORA PJ
Andressa Ariadeny Marques Granja	11242844430	marquesandressa027@gmail.com	87991189813	10	50	ATIVO	SIM	CORA PJ
Andressa dos Santos Souza Castro		dressa2802@gmail.com	87988272311	10	50	ATIVO	SIM	CORA PJ
Andreza Rodrigues de Oliveira		ao766978@gmail.com	74988554706	10	50	ATIVO	SIM	CORA PJ
Ângela Maria Vieira dos santos	44311915420	soangella2@hotmail.com	87988170075	10	50	ATIVO	SIM	CORA PJ
Ângela Nayara Santos de Araújo		nayaraangela592@gmail.com	74988272500	20	50	ATIVO	SIM	CORA PJ
Anna Karoliny Duarte Cardoso Tavares	86219802586	tavareskarol20@gmail.com	74999651290	10	50	ATIVO	SIM	CORA PJ
Antonio Correia de Araújo Filho	22057994449	antoniofilhoatelie@hotmail.com	87991649868	10	50	ATIVO	SIM	CORA PJ
Antonio Senir dos Santos		jeane_moura@outlook.com	74988035734	10	50	ATIVO	SIM	CORA PJ
Aretha de Oliveira Dias da Silva		diasaretha1@gmail.com	74988420916	10	50	ATIVO	SIM	CORA PJ
Ariel soares de melo		cremildasoaresdemelo@gmail.com	87999150264	10	50	ATIVO	SIM	CORA PJ
Arthur Barreto Pires de Souza		alexsandra173@gmail.com	87988500298	20	50	ATIVO	SIM	CORA PJ
Arthur Laurentino de Sá	08932230340	fabianodesasantos@hotmail.com	87992066227	10	50	ATIVO	SIM	CORA PJ
Aurenice Alves da Silva	07571800439	aurenicealves788@gmail.com	87991105472	10	50	ATIVO	SIM	CORA PJ
Auriane Oliveira		aurianeoliveira.rh@gmail.com	74988215031	10	50	ATIVO	SIM	CORA PJ
Ayla Hialy Oliveira de Carvalho Nunes		aylahialyoliveira@gmail.com	74999232503	10	50	ATIVO	SIM	CORA PJ
Beatryce Fernandes de Souza Ribeiro	05484509432	beatrycefernandes7@gmail.com	87991050737	10	50	ATIVO	SIM	CORA PJ
Blenda Francilda Silva do Carmo Oliveira		blenda_silva85@hotmail.com	74988073998	10	50	ATIVO	SIM	CORA PJ
Brena Almeida		brenaalmeida.agro@gmail.com	74988042083	10	50	ATIVO	SIM	CORA PJ
Brenda Gonçalves Costa	03836443562	brendagc1994@hotmail.com	74988112013	10	50	ATIVO	SIM	CORA PJ
Bruna Ferreira de Souza		bruninhafds85@hotmail.com	74988057622	10	50	ATIVO	SIM	CORA PJ
Caio Gabriel Libório Cabral		cg.cabral08@gmail.com	74999194095	10	50	ATIVO	SIM	CORA PJ
Camila Cavalcanti		cacbione@gmail.com	87988637173	20	50	ATIVO	SIM	CORA PJ
Camila michely delmonde da silva		camiladelmonde1406@gmail.com	87991235540	10	50	ATIVO	SIM	CORA PJ
CÂNDIDO AUGUSTO PIRES ALVES HOLANDA		margaridagleide@gmail.com	87991119683	10	50	ATIVO	SIM	CORA PJ
Carlos Manoel Viana evangelista		c.m.viana2021@gmail.com	87988553708	10	50	ATIVO	SIM	CORA PJ
CAROLINNE CAVALCANTE DE CARVALHO MARTINS		carol24121@outlook.com	74988269111	10	50	ATIVO	SIM	CORA PJ
Cicera Pereira calixto	03443142435	cicerapereira.calixta@gmail.com	8799676719	10	50	ATIVO	SIM	CORA PJ
Cícero Adson Barbosa Almino de Lima		cicero_019@hotmail.com	87988240063	10	50	ATIVO	SIM	CORA PJ
CIDEIJANE HENRIQUE BELO		studiocideijane@gmail.com	74981373554	10	50	ATIVO	SIM	CORA PJ
Cinthia Feitoza de Souza	10202917452	feitoza.cinthia04@gmail.com	74988389434	20	50	ATIVO	SIM	CORA PJ
Cinthia Rejane Da Silva Pereira Rocha	14052795830	silvapereiracinthiarejane@gmail.com	74988444104	10	50	ATIVO	SIM	CORA PJ
Claudivania Benicia da Silva		beniciaclaudivania@gmail.com	87996642928	10	50	ATIVO	SIM	CORA PJ
Cristiane Ribeiro da Silva		dasilvacristianeribeiro@gmail.com	74999826638	10	50	ATIVO	SIM	CORA PJ
Daiane Silva Barbosa	10439683424	daiane_medeiros@outlook.com	87988354068	10	50	ATIVO	SIM	CORA PJ
Daniela Fernandes Rodrigues		dfrd380@gmail.com	87999609282	10	50	ATIVO	SIM	CORA PJ
Danila Almeida Freire	09888118471	danilafreire1@hotmail.com	74988187200	10	50	ATIVO	SIM	CORA PJ
David Wilson Dourado Silva		drawdystpool60@gmail.com	74988124249	10	50	ATIVO	SIM	CORA PJ
Débora nascimento da Silva Costa	06613456535	nascimentodebora085@gmail.com	74991349902	10	50	ATIVO	SIM	CORA PJ
DEBORA PRISCILIANE DA SILVA SOUZA		dprisciliane@gmail.com	87999388051	10	50	ATIVO	SIM	CORA PJ
Deuzanira de Sousa Silva		deuzaniraa59@gmail.com	89994620525	10	50	ATIVO	SIM	CORA PJ
Diogo Angelin Ferreira		diogoangelinferreira@gmail.com	74999450997	10	50	ATIVO	SIM	CORA PJ
Dourival Evangelista Duarte		elionor.medrado@hotmail.com	74999183485	10	50	ATIVO	SIM	CORA PJ
Edson Carlos Gomes de Oliveira		krisney.kamila05@gmail.com	87996818405	10	50	ATIVO	SIM	CORA PJ
EDUARDO LIBORIO DA MOTA		eduardoliborio18@gmail.com	74988390274	10	50	ATIVO	SIM	CORA PJ
Elane Alencar lima da Silva		elaneemiguel1@gmail.com	87988657315	10	50	ATIVO	SIM	CORA PJ
Elayne Lima Meira		elayne11lima@gmail.com	74988350603	10	50	ATIVO	SIM	CORA PJ
Eliana Josefa Sales		elianajosefasales05@gmail.com	87988112793	10	50	ATIVO	SIM	CORA PJ
Élida Cristina Barroso Cruz		elidacruz123@hotmail.com	74999089206	10	50	ATIVO	SIM	CORA PJ
Eliene lustoza Rodrigues		elylustoza26@gmail.com	87981588843	10	50	ATIVO	SIM	CORA PJ
Elissandra Micaela do Nascimento Souza		micaelaejunior9285@gmail.com	87988433469	10	50	ATIVO	SIM	CORA PJ
Emanuela Messias da silva		emanuelamessiasdasilva@gmail.com	87988698962	10	50	ATIVO	SIM	CORA PJ
Emilene Cavalcante da Cruz		familibmj@gmail.com	81996528523	10	50	ATIVO	SIM	CORA PJ
EMILY Ellen Lima Santos		emi.lytasse05@gmail.com	74981248221	10	50	ATIVO	SIM	CORA PJ
Erica da Silva Guedes	03384285506	ericaguedes069@gmail.com	74988510528	10	50	ATIVO	SIM	CORA PJ
Erica Raissa		erica_winx@hotmail.com	74988154685	10	50	ATIVO	SIM	CORA PJ
Érica Sabrina Ferreira da Silva	70618365478	ferreiraericasabrina@gmail.com	87988456430	10	50	ATIVO	SIM	CORA PJ
Erikson Erick Cruz da Silva		erikson.erick93@gmail.com	74988339507	10	50	ATIVO	SIM	CORA PJ
Evellyn Thainá Ramos Cardoso		lucianawilson37@gmail.com	87991093811	10	50	ATIVO	SIM	CORA PJ
Fabiana Brito Amorim	05204341455	toda.bela100@hotmail.com	87988016221	10	50	ATIVO	SIM	CORA PJ
Fernanda Albuquerque	70860176479	fernanda20021212@gmail.com	87991699317	10	50	ATIVO	SIM	CORA PJ
Fernanda Andréia da Silva	08495379406	nandylucas@hotmail.com	87981776147	10	50	ATIVO	SIM	CORA PJ
FERNANDA CAROLINE SILVA SANTOS		nanda.carollynne23@gmail.com	87996692977	10	50	ATIVO	SIM	CORA PJ
Fernando Alex de Andrade e Silva	74804332472	fernandoalex_as@hotmail.com	87988057979	10	50	ATIVO	SIM	CORA PJ
Flávia Alves S. Nunes Nogueira		consest.flavia@gmail.com	87981473463	10	50	ATIVO	SIM	CORA PJ
Flavia Rafaela Rodrigues dos Santos		flavia-rodrigues15@hotmail.com	87988558836	10	50	ATIVO	SIM	CORA PJ
Francidalva Alencar dos Santos		francyalencar2@gmail.com	74991584272	10	50	ATIVO	SIM	CORA PJ
Francileide de Carvalho Silva 087.559.724-62	08755972462087	francileide.carvalho.silva@outlook.com	87992034565	10	50	ATIVO	SIM	CORA PJ
Francimar Menezes de Souza		francimarmenezespnz@gmail.com	87981320035	10	50	ATIVO	SIM	CORA PJ
FRANCISCO LEÔNIDAS MACIEL LOPES		leonidas.lopes78@gmail.com	87999820771	10	50	ATIVO	SIM	CORA PJ
Geisiane de Oliveira Silva		oliveirageisa0107@hotmail.com	87991742148	10	50	ATIVO	SIM	CORA PJ
GENEILDA DA SILVA BARBOSA	10464327458	geneildasilvab@gmail.com	87981332128	10	50	ATIVO	SIM	CORA PJ
Geralda Alice do Nascimento de Souza Leão		laladaleao@gmail.com	7498814382	10	50	ATIVO	SIM	CORA PJ
Geraldo Monteiro de Assis	34002626415	erika_petrolina@hotmail.com	87988330035	10	50	ATIVO	SIM	CORA PJ
Gessica Nunes Dias	71094734497	gessica12nunes@gmail.com	87999398830	10	50	ATIVO	SIM	CORA PJ
Gildenor Rodrigues de sena		halanesena91@gmail.com	87988748011	10	50	ATIVO	SIM	CORA PJ
Gilmar Damião de Queiroz		gilmardqueiroz73@gmail.com	87991080383	10	50	ATIVO	SIM	CORA PJ
Gilvan Araújo Ribeiro		araujoribeirogilvan6@gmail.com	87991403429	10	50	ATIVO	SIM	CORA PJ
Givaldo Evangelista Pateiro		givaldoevangelistapateiro@gmail.cm	87988339961	10	50	ATIVO	SIM	CORA PJ
Glaucianne Cavalcante da Conceição		glauciannecavalcante@gmail.com	74988165022	10	50	ATIVO	SIM	CORA PJ
Gleice Kelly de jesus	01943295506	gleicekelly0211@gmail.com	74998000018	10	50	ATIVO	SIM	CORA PJ
Gleiciane Pereira da silva	07455795408	gleicy6327@gmail.com	87992100897	10	50	ATIVO	SIM	CORA PJ
Graziela Feitoza da silva		grazi.feitoza.silva@gmail.com	74988085252	10	50	ATIVO	SIM	CORA PJ
Helana murielle da Silva		helanamurieli321@gmail.com	74999620999	10	50	ATIVO	SIM	CORA PJ
Helber Passos Ferreira	86152612535	helberpassos3@gmail.com	74988516155	10	50	ATIVO	SIM	CORA PJ
Helena Maria Rodrigues	09055071420	helena12mr@outlook.com	87981065990	10	50	ATIVO	SIM	CORA PJ
Helena Yasmin Santos Ferreira		ednap997@gmail.com	74988563527	10	50	ATIVO	SIM	CORA PJ
Henrique Bruno dos Santos Lima		hbruno.slima@gmail.com	87981566539	10	50	ATIVO	SIM	CORA PJ
Hildeberto Maia Da Silva Neto	00883189585	maiadasilvaneto21@gmail.com	87988647763	10	50	ATIVO	SIM	CORA PJ
Hosana maia neves		hosanamaianeves14@gmail.com	87991346261	10	50	ATIVO	SIM	CORA PJ
Iara Karoline Pereira Silva		iarakaroline226@gmail.com	87991763743	10	50	ATIVO	SIM	CORA PJ
ILLANA DO NASCIMENTO SOUZA	01373379499	illana.souza@gmail.com	87996297490	10	50	ATIVO	SIM	CORA PJ
Ingrid Luana dos Santos Carvalho		ingridlua3009@gmail.com	74988274161	10	50	ATIVO	SIM	CORA PJ
Ingrid Luana Nascimento Santana	07879774548	guivaresbgn@gmail.com	87988086574	10	50	ATIVO	SIM	CORA PJ
Isodete Rodrigues dos Santos Amorim	97568929434	isodete.isaac@gmail.com	87988143420	10	50	ATIVO	SIM	CORA PJ
Jaci Ferreira		jaciferreiralima1973@gmail.com	87999222153	10	50	ATIVO	SIM	CORA PJ
Jacilene Juscilene Rodrigues		jacilenejuscilene@gmail.com	87988149118	10	50	ATIVO	SIM	CORA PJ
Jaime Belarmino Gomes de Azevedo		jaime@vai.ma	87988119360	10	50	ATIVO	SIM	CORA PJ
Jair Alencar		jairalenncar@gmail.com	87999159866	10	50	ATIVO	SIM	CORA PJ
Janaina Teotônio Passos		janateopa23@gmail.com	74991020275	10	50	ATIVO	SIM	CORA PJ
Jaqueline Caroline Cordeiro		jackcordeiro2130@gmail.com	87991114444	10	50	ATIVO	SIM	CORA PJ
Jeane dos Santos Barros		escolaouroverde2017@gmail.com	87998233687	10	50	ATIVO	SIM	CORA PJ
Jenifer Santos Ribeiro	07970159575	ribeirojenifer87@gmail.com	74988143065	10	50	ATIVO	SIM	CORA PJ
Jessica Karolina Cruz Silva		jehkarolinaa25@gmail.com	87988037677	10	50	ATIVO	SIM	
JOÃO PAULO FREIRE MUNIZ DE VASCONCELOS	05957225479	joaopaulofmv@gmail.com	87988419513	10	50	ATIVO	SIM	CORA PJ
João Pedro de Oliveira Nobre Gabriel de Jesus		dnobre1@hotmail.com	87988558588	10	50	ATIVO	SIM	CORA PJ
Joelma Farias dos Santos Menezes		joelmafariasdossantosmenezes@gmail.com	87988226523	10	50	ATIVO	SIM	CORA PJ
Jorgina Celina dos Santos		jorgina_30@hotmail.com	74988565590	10	50	ATIVO	SIM	CORA PJ
José Danilo Cavalcante		josedanilok45@gmail.com	74988465900	10	50	ATIVO	SIM	CORA PJ
José Neves de Freitas		annecneves@yahoo.com.br	87988369149	10	50	ATIVO	SIM	CORA PJ
Joseane rodrigues pereira		fretesjgtransporte@gmail.com	87991189153	10	50	ATIVO	SIM	CORA PJ
Joselita Maria Ribeiro		adivaniribeiro23@gmail.com	87991714634	10	50	ATIVO	SIM	CORA PJ
Jucileide Dayana Silva		jucileidedayana@gmail.com	87996255764	10	50	ATIVO	SIM	CORA PJ
Juliana Palmeira		julianapalmeiradossantos@gmail.com	87991998746	10	50	ATIVO	SIM	CORA PJ
Kananda Gomes Duarte	09159852410	kanandaduarte5@gmail.com	87991751171	10	50	ATIVO	SIM	CORA PJ
Karmelyenne Pereira da Silva	09971957469	karmelyennesilva@gmail.com	87988529357	10	50	ATIVO	SIM	CORA PJ
Keila Márcia de Oliveira		deoliveirakeilamarcia@gmail.com	74988117163	10	50	ATIVO	SIM	CORA PJ
Kerley Helena de Lira Ferreira dos Santos		kerley.ellen@hotmail.com	87988581856	10	50	ATIVO	SIM	CORA PJ
Larissa Carvalho da costa		larissadaccosta@gmail.com	87981171125	10	50	ATIVO	SIM	CORA PJ
Lauro Gonzaga da Silva	00867471425	gonzaga.lauro@gmail.com	87988065626	10	50	ATIVO	SIM	CORA PJ
Lavínia Suely Silva Ribeiro		vitoriadebora106@gmail.com	87981501792	10	50	ATIVO	SIM	CORA PJ
Layra Catarine Costa da Silva Cavalcante		layracatarine@gmail.com	74988038667	10	50	ATIVO	SIM	CORA PJ
Lêdyoneide Matias da Silva		leidinhasilva.araujo@gmail.com	87996552832	10	50	ATIVO	SIM	CORA PJ
Leonor Campos Lima		leonorleocampos@gmail.com	87988043519	10	50	ATIVO	SIM	CORA PJ
Lidiane costa lima	01038596599	lidianelima141@outlook.com	74988433801	10	50	ATIVO	SIM	CORA PJ
Luandson de Macedo Araújo		luanmacedo1502@gmail.com	87991080383	10	50	ATIVO	SIM	CORA PJ
Lucas paixao santos		lucaspaixaolps9@gmail.com	74999173185	10	50	ATIVO	SIM	CORA PJ
Luciana Santos Ribeiro Alves		lu_ian15@hotmail.com	74988218720	10	50	ATIVO	SIM	CORA PJ
Luciane Silva Oliveira Nunes		lucianegui397@gmail.com	74999116916	10	50	ATIVO	SIM	CORA PJ
Lucimara Aparecida Nunes da Silva		xaviervariedadess176@gmail.com	74988037334	10	50	ATIVO	SIM	CORA PJ
Luis Felipe Guimarães Silva		luisfelipesilva396@gmail.com	87988064043	10	50	ATIVO	SIM	CORA PJ
Luis Fellipe Melo Neto	07808982490	l.fellipemelo@gmail.com	87996359218	10	50	ATIVO	SIM	CORA PJ
MANOEL MARTINS DA SILVA		rmartinslbe@hotmail.com	87991877431	10	50	ATIVO	SIM	CORA PJ
MANOEL OLEGARIO ALVES DA SILVA		da4038091@gmail.com	74999835468	10	50	ATIVO	SIM	CORA PJ
Marcelina Alves ferreira		marcelinaalves6580@gmail.com	98872717287	10	50	ATIVO	SIM	CORA PJ
Marco Vinícius Silva Dantas		mv.somar@gmail.com	87999049258	10	50	ATIVO	SIM	CORA PJ
Marconi Almino de Lima		marconi.almino@hotmail.com	87981151836	10	50	ATIVO	SIM	CORA PJ
Maria Aparecida Silva Dos Santos		mariaaparecidamass@hotmail.com	74991143318	10	50	ATIVO	SIM	CORA PJ
Maria Auxiliadora César Loiola		maria.2706aux@gmail.com	87988640525	10	50	ATIVO	SIM	CORA PJ
Maria Clara soares matos		mariaclarasoaresmatos282@gmail.com	87981772202	10	50	ATIVO	SIM	CORA PJ
Maria de Lourdes Rosa dos Santos	44969368449	lidiane.pe15@gmail.com	87988192583	10	50	ATIVO	SIM	CORA PJ
Maria delcelene Lima da silva		cilenelimadasilva131@gmail.com	87981511938	10	50	ATIVO	SIM	CORA PJ
MARIA DO ROSÁRIO MEDEIROS RAMOS		mrm.ramos100@gmail.com	74999663848	10	50	ATIVO	SIM	CORA PJ
Maria do Socorro da Silva	05067317582	socorrocelestino32@gmail.com	87991138268	10	50	ATIVO	SIM	CORA PJ
Maria do Socorro Félix dos Santos		maria.20felixx@gmail.com	87981716482	10	50	ATIVO	SIM	CORA PJ
Maria do Socorro Rodrigues de Sousa		marisousa9803@gmail.com	8791969335	10	50	ATIVO	SIM	CORA PJ
Maria dos Remédios Lacerda Coelho	54133114434	lalysindsemp@hotmail.com	87988552410	10	50	ATIVO	SIM	CORA PJ
Maria Edleide Pereira do Nascimento		ledapereira198@gmail.com	74988324531	10	50	ATIVO	SIM	CORA PJ
Maria Edna Fernandes Furtado		edna83691@gmail.com	87988447127	10	50	ATIVO	SIM	CORA PJ
Maria Elizangela Ferreira dos Santos		elizangela4038091@gmail.com	74988446566	10	50	ATIVO	SIM	CORA PJ
Maria Gabrielly santos soares		gabriellysoares2009@gmail.com	74988546993	10	50	ATIVO	SIM	CORA PJ
Maria Greicia Vieira dos Santos Braga		fernadasantosbraga@hotmail.com	74988147344	10	50	ATIVO	SIM	CORA PJ
Maria Helena Pereira		mhelenap40@hotmail.com	87988375948	10	50	ATIVO	SIM	CORA PJ
Maria José Menezes da Silva		anamariameneses4665@gmail.com	74988376518	10	50	ATIVO	SIM	CORA PJ
MARIA JUSCILEIA SILVA CAMPOS	03994920469	juscycampos@hotmail.com	87988189035	10	50	ATIVO	SIM	CORA PJ
Maria neliane Coelho Gomes		marianelianecoelho2021@hotmail.com	87981715721	10	50	ATIVO	SIM	CORA PJ
Maria Nelly Nunes Cavalcante		marianellycavalcante@gmail.com	87991419239	10	50	ATIVO	SIM	CORA PJ
Maria Regina Galvão Dias	11618646443	reginagalvao510@gmail.com	87991964550	10	50	ATIVO	SIM	CORA PJ
Mariana Nunes Macedo		macedonunes60@gmail.com	87981243153	10	50	ATIVO	SIM	CORA PJ
Marina Oliveira de Menezes		marinaoliveiramz@gmail.com	87988460967	10	50	ATIVO	SIM	CORA PJ
Marla Mirele Santos Souza Alencar		santosmirele@hotmail.com	74988393789	10	50	ATIVO	SIM	CORA PJ
Mateus Galvão de Souza		mateus05.souza11@gmail.com	87988674150	10	50	ATIVO	SIM	CORA PJ
Matheus Medrado Duarte		mat.medrado97@gmail.com	74999987446	10	50	ATIVO	SIM	CORA PJ
Maycon Gleydson Bernardes de Lima	09862990490	mayconbernardes.18@hotmail.com	87988459626	10	50	ATIVO	SIM	CORA PJ
Messias Genelicio de Almeida		messias.consultoriaagro@gmail.com	74981199070	20	50	ATIVO	SIM	CORA PJ
Michelle Almeida Rodrigues	11143987489	almeidamichelle144@gmail.com	87988021746	10	50	ATIVO	SIM	CORA PJ
Michelly Elen Leal Menezes Torres		michellyelen@gmail.com	87996425010	10	50	ATIVO	SIM	CORA PJ
Mirelly dos Santos		santosmirelly165@gmail.com	87991203120	10	50	ATIVO	SIM	CORA PJ
Mirelly dos Santos		jukinhasilva773@gmail.com	87991203120	10	50	ATIVO	SIM	CORA PJ
Nadyelle Patricia Barros Santos	03331902543	nadyelle.patricia@gmail.com	87981111810	10	50	ATIVO	SIM	CORA PJ
Naiara batista dos santos	63084825440	naiarabatista317@gmail.com	74998074170	10	50	ATIVO	SIM	CORA PJ
Narciso Macedo Cavalcante		marcioeregistransportes@hotmail.com	89994065593	10	50	ATIVO	SIM	CORA PJ
Natalia Patrícia Silva Lima		aline88425250@gmail.com	87988036296	10	50	ATIVO	SIM	CORA PJ
Pablo Gustavo Silva Feitoza		pablogustavosf@hotmail.com	87996110385	10	50	ATIVO	SIM	CORA PJ
PABLO KAYQUE SILVA PEREIRA SANTANA	08854888494	bragavaldeuza@gmail.com	87999716450	10	50	ATIVO	SIM	CORA PJ
Patrícia Ferreira dos Santos Moura	00147016509	patyfsm2013@hotmail.com	87988191495	10	50	ATIVO	SIM	CORA PJ
Pedro Lucas De Souza Nascimento		bplucas.com.br@gmail.com	87988091271	10	50	ATIVO	SIM	CORA PJ
poliana lopes Feitosa	07445374442	polianalopesfeitosa@gmail.com	87991173004	10	50	ATIVO	SIM	CORA PJ
Rahyane Crys Pereira de Carvalho	07060829407	rahyanecarvalho13@outlook.com	87996232376	10	50	ATIVO	SIM	CORA PJ
Raphaella Monteiro da Silva	08350372583	raphaella.monteiro@outlook.com	74988377949	10	50	ATIVO	SIM	CORA PJ
Rayane Barbosa de Souza	11421473470	rayanebarbosasouzabeni@gmail.com	87991068939	10	50	ATIVO	SIM	CORA PJ
Renato Gomes Ferraz	65728823491	renatasfer95@gmail.com	74981138111	10	50	ATIVO	SIM	CORA PJ
Roberta Muniz da Silva		muniz.roberta2015@gmail.com	87996549773	10	50	ATIVO	SIM	CORA PJ
RODRIGO CANAU DA SILVA SANTOS	81047380544	rodrigo.cssantos@adm.educacao.pe.gov.br	74988273336	10	50	ATIVO	SIM	CORA PJ
ROGNON ANTÔNIO DA SILVA		rarognonantonio@hotmail.com	87999073803	10	50	ATIVO	SIM	CORA PJ
Roniel Feitosa	19598453812	feitosaroniel@gmail.com	74988255082	10	50	ATIVO	SIM	CORA PJ
Rose France Cardoso Barros	02318581401	rosefrance2@hotmail.com	87988030981	10	50	ATIVO	SIM	CORA PJ
Rosikelly pereira de Souza		rosikelly94@gmail.com	87988378719	10	50	ATIVO	SIM	CORA PJ
Roziane Siqueira Costa Granja		adrianapnz1@gmail.com	87996236425	10	50	ATIVO	SIM	CORA PJ
Ruamma Granja bezerra		ruamma4@gmail.com	87999790522	10	50	ATIVO	SIM	CORA PJ
RUTE MARIAH		rmariahdourado@gmail.com	74988380874	10	50	ATIVO	SIM	CORA PJ
Sâmela Deise de Pinho Gonçalves	06420721598	sameladeyse@gmail.com	74988433801	10	50	ATIVO	SIM	CORA PJ
Sérgio Modesto de Miranda		mbeneditaaraujo458@gmail.com	87981049812	10	50	ATIVO	SIM	CORA PJ
Severino ramos Soares Gomes		severino8877severino@gmail.com	87988177462	10	50	ATIVO	SIM	CORA PJ
Shirlene Lopes da Silva		lenelopes83@outlook.com	87988612077	10	50	ATIVO	SIM	CORA PJ
Silmara Doralice Alves Mascarenhas		silmaradoralice5@gmail.com	87999013623	10	50	ATIVO	SIM	CORA PJ
Stefany Bernardo dos Santos		stefanybernardo27@gmail.com	87996271418	10	50	ATIVO	SIM	CORA PJ
Stefany Suany Pereira Macedo		stefanymacedo621@gmail.com	74988733468	10	50	ATIVO	SIM	CORA PJ
Synnara Cruz vasconcelos		naoideb12@gmail.com	8799193547	10	50	ATIVO	SIM	CORA PJ
Taís dos Santos Rodrigues		stais2787@gmail.com	87988319110	10	50	ATIVO	SIM	CORA PJ
TARGIELI DOS SANTOS SOARES	08430912401	eng.targieli@gmail.com	87988027516	10	50	ATIVO	SIM	CORA PJ
Tatiane Amaral Magalhães	07434746432	tatianeamaral11@gmail.com	87991827673	10	50	ATIVO	SIM	CORA PJ
Teresinha Alves Pereira de Souza		fabricio.cabeca@hotmail.com	74988182530	10	50	ATIVO	SIM	CORA PJ
Thiara Ferreira dos Santos		thiara-f@hotmail.com	74991428059	10	50	ATIVO	SIM	CORA PJ
ueldijane lima de souza		uellima7@gmail.com	74988587779	10	50	ATIVO	SIM	CORA PJ
Valdecino Alves Rodrigues		grillfatiado@gmail.com	87999778758	10	50	ATIVO	SIM	CORA PJ
Valeria Medrado Duarte		valeria.medrado@hotmail.com	87981205357	10	50	ATIVO	SIM	CORA PJ
Vitória Berben sobreira		vitoria.vydaa@gmail.com	74988250348	10	50	ATIVO	SIM	CORA PJ
Vitória Caroline da Silva Reis	12210515475	vc45638@gmail.com	87988135549	10	50	ATIVO	SIM	CORA PJ
Vitória Thaysa Gomes de Moura		vitoriathaysagomes@gmail.com	87991545672	20	50	ATIVO	SIM	CORA PJ
walquiana santos		walquianasantos@gmail.com	87988256759	10	50	ATIVO	SIM	CORA PJ
Wanessa Nunes Barros		wanessanunesbarros@gmail.com	87991567609	10	50	ATIVO	SIM	CORA PJ
Wanielly fabryne de Araújo Gomes		wanielly1@outlook.com	87981551878	10	50	ATIVO	SIM	CORA PJ
Weyde Estefany	10095619445	weydeestefany@gmail.com	87988661073	10	50	ATIVO	SIM	CORA PJ
Wilmara Rodrigues de Queiroz		marinhaqueiroz92@gmail.com	87991080383	10	50	ATIVO	SIM	CORA PJ
YARLA FERNANDA		yarlafernanda399@gmail.com	87988423291	10	50	ATIVO	SIM	CORA PJ
Yasmin Amorim Lima	71194591477	yasmin.limaa2308@gmail.com	87991698472	10	50	ATIVO	SIM	CORA PJ
Yasmin Neci Rodrigues Cavalcanti		yasminvieirq@outlook.com	87991573898	10	50	ATIVO	SIM	CORA PJ
Yrllana Magalhaes Gomes de Almeida		mariamariadistribuidor@gmail.com	74981344555	10	50	ATIVO	SIM	CORA PJ
Zevaldinete Araujo Gomes	39072550463	valdineteval@hotmail.com	87991383336	20	50	ATIVO	SIM	CORA PJ
`

    const lines = RAW_DATA.trim().split('\n')
    let updated = 0
    let errors = 0

    for (const line of lines) {
      let parts = line.split('\t')
      if (parts.length < 5) {
        parts = line.split(/\s{2,}/)
      }
      if (parts.length < 5) continue

      const nome = parts[0].trim()
      const cpfRaw = parts[1].trim()
      const email = parts[2].trim()
      const telefone = parts[3].trim()
      const dia = parseInt(parts[4])
      const valorStr = parts[5].replace('R$', '').replace('.', '').replace(',', '.').trim()
      const valor = parseFloat(valorStr)
      const status = parts[6].trim().toLowerCase()
      const recorrencia = parts[7].trim().toUpperCase() === 'SIM'
      const conta = parts[8]?.trim() || ''

      // Busca por email
      const { data: a1 } = await sb.from('associados').select('id').ilike('email', email.trim()).maybeSingle()
      let tid = a1?.id

      if (!tid) {
        const { data: a2 } = await sb.from('associados').select('id').ilike('nome', nome).limit(1).maybeSingle()
        tid = a2?.id
      }

      if (tid) {
        const { error } = await sb.from('associados').update({
          cpf: cpfRaw || undefined,
          telefone: telefone,
          vencimento_dia: dia,
          mensalidade: valor,
          status: status,
          recorrencia_ativa: recorrencia,
          conta_recorrencia: conta || null
        }).eq('id', tid)
        if (!error) updated++
        else errors++
      } else {
        errors++
      }
    }
    alert(`Concluído! ${updated} associados atualizados, ${errors} não encontrados.`)
    refresh()
  } catch (err: any) {
    alert('Erro: ' + err.message)
  } finally {
    setFixing(false)
  }
}

  const handleFixPlanoContas = async () => {
    setFixing(true)
    try {
      // 1. Identifica o tenant atual do usuário (lógica similar ao getMyTenantIdAction)
      const { data: { user } } = await sb.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Tenta Metadados do JWT primeiro
      let tid = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id

      // Tenta tabela usuarios se falhar
      if (!tid) {
        const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
        tid = userData?.tenant_id
      }

      // Fallback final do sistema (ACPROBEC)
      if (!tid) {
        tid = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
      }

      console.log('Corrigindo plano para tenant:', tid)

      let count = 0
      const accountsToAdd = [
        { codigo: '1.1.1.4', descricao: 'Banco Cora PJ', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'ativo', aceita_lancamentos: true, ativa: true, parent: '1.1.1' },
        { codigo: '1.1.1.01.100', descricao: 'CAIXA (ESPÉCIE)', nivel: 5, tipo: 'analitica', natureza: 'devedora', classificacao: 'ativo', aceita_lancamentos: true, ativa: true, parent: '1.1.1' },
        { codigo: '1.1.1.02.100', descricao: 'CORA PJ', nivel: 5, tipo: 'analitica', natureza: 'devedora', classificacao: 'ativo', aceita_lancamentos: true, ativa: true, parent: '1.1.1' },
        { codigo: '1.1.2.4', descricao: 'Taxas de Adesão', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'ativo', aceita_lancamentos: true, ativa: true, parent: '1.1.2' },
        { codigo: '3.1.3', descricao: 'Taxas de Adesão', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'ingresso', aceita_lancamentos: true, ativa: true, parent: '3.1' }
      ]
      
      for (const acc of accountsToAdd) {
        // Verifica se a conta já existe
        const { data: existing } = await sb.from('plano_contas')
          .select('id')
          .eq('tenant_id', tid)
          .eq('codigo', acc.codigo)
          .maybeSingle()
          
        if (!existing) {
          // Busca o pai para herdar o ID se necessário (opcional no schema, mas bom para organização)
          const { data: pai } = await sb.from('plano_contas')
            .select('id')
            .eq('tenant_id', tid)
            .eq('codigo', acc.parent)
            .maybeSingle()
            
          const { error: insError } = await sb.from('plano_contas').insert({
            tenant_id: tid,
            codigo: acc.codigo,
            descricao: acc.descricao,
            nivel: acc.nivel,
            tipo: acc.tipo,
            natureza: acc.natureza,
            classificacao: acc.classificacao,
            aceita_lancamentos: acc.aceita_lancamentos,
            ativa: acc.ativa,
            conta_pai_id: pai?.id || null
          })

          if (insError) {
            console.error(`Erro ao inserir ${acc.codigo}:`, insError.message)
          } else {
            count++
          }
        }
      }
      
      // 2. Garante que o mapeamento de categoria também exista
      await sb.from('configuracoes_contabeis').upsert({
        tenant_id: tid,
        categoria_nome: 'ADESÃO',
        conta_contabil_codigo: '3.1.3',
        conta_contabil_nome: 'Taxas de Adesão',
        tipo: 'ingresso',
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,categoria_nome' })

      // 3. Desativa contas "antigas/genéricas" para não poluir a visualização (opcional, conforme pedido)
      const oldAccounts = ['1.1.1.1', '1.1.1.2', '1.1.1.3']
      await sb.from('plano_contas')
        .update({ ativa: false })
        .eq('tenant_id', tid)
        .in('codigo', oldAccounts)

      alert(`Concluído! ${count} novas contas adicionadas, mapeamento de "ADESÃO" configurado e contas genéricas desativadas.`)
      refresh()
    } catch (err: any) {
      console.error(err)
      alert('Erro ao corrigir plano: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setFixing(false)
    }
  }

  const analysis = useMemo(() => {
    if (loading) return null

    const dia10Names = associados
      .filter(a => a.vencimento_dia === 10)
      .map(a => a.nome.trim().toLowerCase())

    const listNames = USUARIO_LIST.map(n => n.trim().toLowerCase())

    const missingInSystem = USUARIO_LIST.filter(n => !dia10Names.includes(n.trim().toLowerCase()))
    const extraInSystem = associados
      .filter(a => a.vencimento_dia === 10 && !listNames.includes(a.nome.trim().toLowerCase()))
      .map(a => a.nome)

    return { missingInSystem, extraInSystem }
  }, [associados, loading])

  if (loading) return <div className="p-10">Carregando dados...</div>

  return (
    <div className="p-10 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold">Ferramentas de Auditoria e Recuperação</h1>
          <p className="text-sm text-slate-500">Use estas ferramentas para corrigir divergências e restaurar dados.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => syncZapSign().then(r => alert((r as any).message || 'Sincronização concluída'))}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
          >
            1. Sincronizar ZapSign
          </button>
          <button 
            onClick={handleFixOrphans}
            disabled={fixing}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            2. Corrigir Vínculos Órfãos
          </button>
          <button 
            onClick={handleRestoreConfigs}
            disabled={fixing}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            3. Restaurar Configurações (Cora/Recorrência)
          </button>
          <button 
            onClick={handleFixPlanoContas}
            disabled={fixing}
            className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            4. Corrigir Plano de Contas (ADESÃO)
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-10">
        <div>
          <h2 className="text-lg font-bold text-rose-600 mb-4">Nomes na lista do usuário MAS NÃO marcados com Dia 10 no sistema ({analysis?.missingInSystem.length}):</h2>
          <ul className="list-disc pl-5 space-y-1">
            {analysis?.missingInSystem.map(n => <li key={n} className="text-sm">{n}</li>)}
          </ul>
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-blue-600 mb-4">Nomes marcados com Dia 10 no sistema MAS NÃO presentes na lista do usuário ({analysis?.extraInSystem.length}):</h2>
          <ul className="list-disc pl-5 space-y-1">
            {analysis?.extraInSystem.map(n => <li key={n} className="text-sm">{n}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
