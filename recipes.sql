--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'LATIN2';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: drzave; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drzave (
    id integer NOT NULL,
    naziv character varying(100) NOT NULL,
    glavni_grad character varying(100),
    povrsina double precision,
    broj_stanovnika bigint,
    valuta character varying(50),
    jezici character varying(255),
    kontinent character varying(50),
    flag_url character varying(255),
    datum_osnivanja date,
    region character varying(100),
    gdp double precision
);


ALTER TABLE public.drzave OWNER TO postgres;

--
-- Name: drzave_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drzave_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drzave_id_seq OWNER TO postgres;

--
-- Name: drzave_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drzave_id_seq OWNED BY public.drzave.id;


--
-- Name: kategorije; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kategorije (
    id integer NOT NULL,
    naziv character varying(50) NOT NULL
);


ALTER TABLE public.kategorije OWNER TO postgres;

--
-- Name: kategorije_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kategorije_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kategorije_id_seq OWNER TO postgres;

--
-- Name: kategorije_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kategorije_id_seq OWNED BY public.kategorije.id;


--
-- Name: oznake; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oznake (
    id integer NOT NULL,
    naziv character varying(50) NOT NULL
);


ALTER TABLE public.oznake OWNER TO postgres;

--
-- Name: oznake_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.oznake_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oznake_id_seq OWNER TO postgres;

--
-- Name: oznake_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.oznake_id_seq OWNED BY public.oznake.id;


--
-- Name: recept_oznake; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recept_oznake (
    recept_id integer NOT NULL,
    oznaka_id integer NOT NULL
);


ALTER TABLE public.recept_oznake OWNER TO postgres;

--
-- Name: recept_sastojci; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recept_sastojci (
    recept_id integer NOT NULL,
    sastojak_id integer NOT NULL,
    kolicina numeric(5,2) NOT NULL,
    mjerna_jedinica character varying(50)
);


ALTER TABLE public.recept_sastojci OWNER TO postgres;

--
-- Name: recepti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recepti (
    id integer NOT NULL,
    naziv character varying(255) NOT NULL,
    opis text,
    youtube_url character varying(255),
    koraci_recepta text NOT NULL,
    wiki_url character varying(255),
    vrijeme_pripreme interval,
    vrijeme_kuhanja interval,
    broj_porcija integer,
    tezina character varying(50),
    drzava_id integer,
    kategorija_id integer
);


ALTER TABLE public.recepti OWNER TO postgres;

--
-- Name: recepti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recepti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recepti_id_seq OWNER TO postgres;

--
-- Name: recepti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recepti_id_seq OWNED BY public.recepti.id;


--
-- Name: sastojci; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sastojci (
    id integer NOT NULL,
    naziv character varying(100) NOT NULL
);


ALTER TABLE public.sastojci OWNER TO postgres;

--
-- Name: sastojci_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sastojci_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sastojci_id_seq OWNER TO postgres;

--
-- Name: sastojci_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sastojci_id_seq OWNED BY public.sastojci.id;


--
-- Name: drzave id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drzave ALTER COLUMN id SET DEFAULT nextval('public.drzave_id_seq'::regclass);


--
-- Name: kategorije id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategorije ALTER COLUMN id SET DEFAULT nextval('public.kategorije_id_seq'::regclass);


--
-- Name: oznake id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oznake ALTER COLUMN id SET DEFAULT nextval('public.oznake_id_seq'::regclass);


--
-- Name: recepti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recepti ALTER COLUMN id SET DEFAULT nextval('public.recepti_id_seq'::regclass);


--
-- Name: sastojci id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sastojci ALTER COLUMN id SET DEFAULT nextval('public.sastojci_id_seq'::regclass);


--
-- Data for Name: drzave; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drzave (id, naziv, glavni_grad, povrsina, broj_stanovnika, valuta, jezici, kontinent, flag_url, datum_osnivanja, region, gdp) FROM stdin;
1	Italija	Rim	301340	60244639	Euro	Talijanski	Europa	https://flagsapi.com/IT/flat/64.png	1861-03-17	Ju�na Europa	2000000000000
2	Japan	Tokijo	377975	125836021	Yen	Japanski	Azija	https://flagsapi.com/JP/flat/64.png	1861-03-17	Isto�na Azija	5000000000000
3	Francuska	Pariz	551695	65273511	Euro	Francuski	Europa	https://flagsapi.com/FR/flat/64.png	0843-03-17	Zapadna Europa	2800000000000
4	Indija	New Delhi	3287263	1380004385	Indijski rupij	Hindi, Engleski	Azija	https://flagsapi.com/IN/flat/64.png	1947-08-15	Ju�na Azija	3000000000000
5	Meksiko	Ciudad de M�xico	1964375	128932753	Meki�ki pesos	�panjolski	Sjeverna Amerika	https://flagsapi.com/MX/flat/64.png	1810-09-16	Srednja Amerika	1200000000000
6	Hrvatska	Zagreb	56594	4105267	Euro	Hrvatski	Europa	https://flagsapi.com/HR/flat/64.png	1991-06-25	Jugoisto�na Europa	600000000000
\.


--
-- Data for Name: kategorije; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kategorije (id, naziv) FROM stdin;
1	Predjelo
2	Glavno jelo
3	Desert
4	U�ina
5	Pi�e
\.


--
-- Data for Name: oznake; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.oznake (id, naziv) FROM stdin;
1	Vegan
2	Vegetarijanski
3	Bez glutena
4	Niskokalori�no
5	Ljuto
\.


--
-- Data for Name: recept_oznake; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recept_oznake (recept_id, oznaka_id) FROM stdin;
\.


--
-- Data for Name: recept_sastojci; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recept_sastojci (recept_id, sastojak_id, kolicina, mjerna_jedinica) FROM stdin;
4	35	0.40	kg
4	26	2.00	kom
4	4	1.00	�lica
4	69	2.00	�lice
4	18	1.00	�lica
4	36	0.10	kg
4	37	0.05	kg
4	38	1.00	�lica
4	39	0.50	�li�ica
8	47	500.00	g
5	40	4.00	kom
5	8	2.00	kom
5	43	2.00	kom
5	44	2.00	kom
5	45	2.00	kom
5	46	2.00	kom
5	47	7.00	kom
5	9	3.00	�e�nja
5	48	1.00	paket
5	71	3.00	dl
6	72	0.50	kg
6	8	1.00	kom
6	9	3.00	�e�nja
6	38	2.00	�lice
6	73	0.50	kom
6	49	1.00	�lica
6	50	6.00	kom
6	12	0.50	dl
6	51	240.00	g
7	74	2.00	kom
7	25	5.00	�lica
7	75	5.00	�lica
7	26	2.00	kom
1	1	1.60	kg
1	2	0.15	kg
1	3	0.15	kg
1	4	0.15	l
1	5	0.40	kg
1	6	0.10	kg
1	7	0.10	kg
1	8	2.00	kom
1	9	5.00	�e�nja
1	10	1.00	�li�ica
7	76	0.10	kg
7	77	0.10	kg
7	78	4.00	kom
7	4	100.00	ml
7	52	1.00	�lica
2	34	1.00	paket
2	65	0.60	kg
2	55	0.07	kg
2	30	1.00	glava
2	31	6.00	plo�ka
2	32	0.15	l
2	33	1.00	�li�ica
2	28	1.00	�li�ica
3	66	1.00	paket
3	67	2.00	l
3	40	0.40	kg
3	68	0.40	kg
3	21	1.00	list
3	45	2.00	kom
3	69	0.10	l
7	79	1.00	�lica
9	54	1.00	kg
9	55	0.15	kg
9	71	0.05	l
9	5	0.20	kg
9	8	1.00	kom
9	9	3.00	�e�nja
9	21	1.00	kom
9	69	1.00	malo
9	47	2.00	kom
9	38	0.50	vezica
9	18	2.00	prstohvata
9	19	3.00	zrna
9	67	2.00	l
9	20	50.00	ml
10	80	1.00	kg
10	57	2.00	kom
10	26	3.00	kom
10	58	700.00	ml
10	59	1.00	kom
10	60	1.00	kom
10	61	2.00	kom
10	62	4.00	�lice
10	63	2.00	kom
10	4	100.00	ml
10	64	100.00	g
8	70	16.00	kg
\.


--
-- Data for Name: recepti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recepti (id, naziv, opis, youtube_url, koraci_recepta, wiki_url, vrijeme_pripreme, vrijeme_kuhanja, broj_porcija, tezina, drzava_id, kategorija_id) FROM stdin;
1	Pa�ticada	Tradicionalno jelo od gove�eg mesa u bogatom umaku, naj�e��e poslu�eno s doma�im njokima.	https://youtu.be/XAE1C4bC9IE?si=yV25H16s-deEe2zB	Meso se marinira preko no�i, zatim se polako kuha u umaku od vina, za�ina i povr�a.	https://hr.wikipedia.org/wiki/Pa%C5%A1ticada	02:00:00	03:00:00	6	Srednje	6	2
2	Sarma	Listovi kiselog kupusa punjeni mljevenim mesom i ri�om, kuhani u bogatom umaku.	https://youtu.be/SGswt_asbzE?si=FtTVa9Y_umo-6RSP	Listove kiselog kupusa napuniti smjesom mesa i ri�e, zamotati i kuhati na laganoj vatri nekoliko sati.	https://hr.wikipedia.org/wiki/Sarma	00:30:00	02:00:00	6	Srednje	6	2
3	�obanac	Spicy gula� od raznih vrsta mesa s paprikom i za�inima, tradicionalno pripreman na otvorenoj vatri.	https://youtu.be/_jWkjbgh9QY?si=Uqt4Ddl92fNUbF-A	Razne vrste mesa izrezati i kuhati sa za�inima i paprikom, dodati krumpir po �elji.	\N	00:30:00	02:30:00	8	Te�ko	6	2
4	Fu�i s tartufima	Tradicionalna istarska tjestenina s umakom od tartufa.	https://www.youtube.com/watch?v=R0ehjlAgGwU	Skuhati fu�e, pripremiti umak od tartufa i poslu�iti.	https://hr.wikipedia.org/wiki/Fu%C5%BEi	00:15:00	00:15:00	4	Jednostavno	6	2
5	Peka	Jelo pripremljeno ispod peke s mesom i povr�em, polako kuhano u vlastitom soku.	https://www.youtube.com/watch?v=_AuZrBuZBC4	Pripremiti meso i povr�e, pe�i ispod peke s krumpirom i za�inima.	https://hr.wikipedia.org/wiki/Peka	00:20:00	03:00:00	6	Te�ko	6	2
6	Brudet	Dalmatinski riblji paprika� od raznih vrsta ribe, kuhano s vinom, lukom i raj�icama.	https://www.youtube.com/watch?v=0riEEGi-VyE	Razne vrste ribe kuhati s lukom, raj�icama, vinom i za�inima.	https://hr.wikipedia.org/wiki/Brodet	00:20:00	01:00:00	4	Srednje	6	2
7	Zagreba�ki odrezak	Panirani tele�i odrezak punjen sirom i �unkom, sli�an be�kom odresku.	https://www.youtube.com/watch?v=RKNAiYN0O4c	Tele�i odrezak napuniti sirom i �unkom, zatim panirati i pr�iti.	\N	00:15:00	00:20:00	2	Jednostavno	6	2
8	Janjetina s ra�nja	Pe�ena janjetina s ra�nja, obi�no poslu�ena s krumpirom i povr�em.	https://www.youtube.com/watch?v=zrhmxqRly2o	Janjetinu za�initi i pe�i na ra�nju, poslu�iti s krumpirom.	https://hr.wikipedia.org/wiki/Janjetina	00:10:00	02:00:00	6	Te�ko	6	2
9	Riblja juha	Lagano jelo od raznih vrsta ribe, kuhano s povr�em.	https://www.youtube.com/watch?v=U0AKuwE5b7A	Ribu kuhati s povr�em i za�inima, poslu�iti kao juhu.	\N	00:15:00	00:40:00	4	Jednostavno	6	1
10	Fritule	Male pr�ene kuglice od tijesta, �esto posute �e�erom u prahu.	https://www.youtube.com/watch?v=1qLk3Xwcsq4	Napraviti tijesto, oblikovati male kuglice i pr�iti.	https://hr.wikipedia.org/wiki/Fritule	00:20:00	00:10:00	6	Jednostavno	6	3
\.


--
-- Data for Name: sastojci; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sastojci (id, naziv) FROM stdin;
1	Gove�i but
2	Suha slanina
3	Mast
4	Ulje
5	Mrkva
6	Celer
7	Korijen per�ina
8	Luk
9	�e�njak
10	Korijander u zrnu
11	Pro�ek
12	Crno vino
13	Raj�ica iz konzerve
14	Mu�kantni ora��i�
15	Klin�i�i
16	Cimet
17	Suhe �ljive
18	Sol
19	Papar
20	Vinski ocat
21	Lovor
22	Ru�marin
23	Kelj
24	Bijeli krumpir
25	Bra�no
26	Jaja
28	Vegeta
30	Kiseli kupus
31	Panceta
32	Passata
33	Dimljena paprika
34	Fant za punjenu papriku i sarmu
35	P�eni�no o�tro bra�no
36	Maslac
37	Tartufi
38	Per�in
39	Vegeta Maestro crni papar mljeveni
40	Svinjetina
41	Teletina
42	Piletina
43	Patlid�an
44	Tikvica
45	Crvena paprika
46	�uta paprika
47	Krumpir
48	Gljive
49	Kapari
50	Masline
51	Pelati
52	Vegeta natur
54	Bijela riba
55	Ri�a
56	Dagnje
57	Dolcela Pra�ak za pecivo
58	Jogurt
59	Korica limuna
60	Korica naran�e
61	Jabuke
62	Rakija lozova�a
63	Vanilin �e�er
64	Pekmez od �ljiva
65	Mljeveno meso
66	Fant mje�avina za slavonski �obanac - ljuti
67	Voda
68	Junetina
69	Bijelo vino
70	Janjetina
71	Maslinovo ulje
72	Riba
73	�ili papri�ica
74	Svinjski lungi�
75	Kru�ne mrvice
76	�unka
77	Sir
78	Kiseli krastavci
79	Senf estragon
80	Mje�avina za fritule i krafne
\.


--
-- Name: drzave_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drzave_id_seq', 6, true);


--
-- Name: kategorije_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kategorije_id_seq', 5, true);


--
-- Name: oznake_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.oznake_id_seq', 5, true);


--
-- Name: recepti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recepti_id_seq', 10, true);


--
-- Name: sastojci_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sastojci_id_seq', 80, true);


--
-- Name: drzave drzave_naziv_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drzave
    ADD CONSTRAINT drzave_naziv_key UNIQUE (naziv);


--
-- Name: drzave drzave_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drzave
    ADD CONSTRAINT drzave_pkey PRIMARY KEY (id);


--
-- Name: kategorije kategorije_naziv_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategorije
    ADD CONSTRAINT kategorije_naziv_key UNIQUE (naziv);


--
-- Name: kategorije kategorije_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategorije
    ADD CONSTRAINT kategorije_pkey PRIMARY KEY (id);


--
-- Name: oznake oznake_naziv_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oznake
    ADD CONSTRAINT oznake_naziv_key UNIQUE (naziv);


--
-- Name: oznake oznake_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oznake
    ADD CONSTRAINT oznake_pkey PRIMARY KEY (id);


--
-- Name: recept_oznake recept_oznake_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recept_oznake
    ADD CONSTRAINT recept_oznake_pkey PRIMARY KEY (recept_id, oznaka_id);


--
-- Name: recept_sastojci recept_sastojci_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recept_sastojci
    ADD CONSTRAINT recept_sastojci_pkey PRIMARY KEY (recept_id, sastojak_id);


--
-- Name: recepti recepti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recepti
    ADD CONSTRAINT recepti_pkey PRIMARY KEY (id);


--
-- Name: sastojci sastojci_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sastojci
    ADD CONSTRAINT sastojci_pkey PRIMARY KEY (id);


--
-- Name: recept_oznake recept_oznake_oznaka_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recept_oznake
    ADD CONSTRAINT recept_oznake_oznaka_id_fkey FOREIGN KEY (oznaka_id) REFERENCES public.oznake(id) ON DELETE CASCADE;


--
-- Name: recept_oznake recept_oznake_recept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recept_oznake
    ADD CONSTRAINT recept_oznake_recept_id_fkey FOREIGN KEY (recept_id) REFERENCES public.recepti(id) ON DELETE CASCADE;


--
-- Name: recept_sastojci recept_sastojci_recept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recept_sastojci
    ADD CONSTRAINT recept_sastojci_recept_id_fkey FOREIGN KEY (recept_id) REFERENCES public.recepti(id) ON DELETE CASCADE;


--
-- Name: recept_sastojci recept_sastojci_sastojak_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recept_sastojci
    ADD CONSTRAINT recept_sastojci_sastojak_id_fkey FOREIGN KEY (sastojak_id) REFERENCES public.sastojci(id) ON DELETE CASCADE;


--
-- Name: recepti recepti_drzava_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recepti
    ADD CONSTRAINT recepti_drzava_id_fkey FOREIGN KEY (drzava_id) REFERENCES public.drzave(id) ON DELETE SET NULL;


--
-- Name: recepti recepti_kategorija_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recepti
    ADD CONSTRAINT recepti_kategorija_id_fkey FOREIGN KEY (kategorija_id) REFERENCES public.kategorije(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

