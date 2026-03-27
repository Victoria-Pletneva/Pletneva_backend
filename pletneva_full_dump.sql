--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.cars DROP CONSTRAINT IF EXISTS cars_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cars ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.cars_id_seq;
DROP TABLE IF EXISTS public.cars;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cars (
    id integer NOT NULL,
    brand character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    year integer NOT NULL,
    price numeric(10,2) NOT NULL,
    available boolean DEFAULT true NOT NULL,
    CONSTRAINT cars_price_check CHECK ((price > (0)::numeric)),
    CONSTRAINT cars_year_check CHECK ((year >= 1900))
);


--
-- Name: cars_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cars_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cars_id_seq OWNED BY public.cars.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password text NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cars id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars ALTER COLUMN id SET DEFAULT nextval('public.cars_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cars; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cars (id, brand, model, year, price, available) FROM stdin;
2	Toyota	Corolla	2021	1800000.00	t
3	Honda	Civic	2023	2200000.00	t
4	Honda	CR-V	2022	2800000.00	f
5	BMW	X5	2023	5500000.00	t
6	BMW	3 Series	2022	3500000.00	t
7	Mercedes-Benz	E-Class	2023	4800000.00	f
8	Audi	Q7	2022	4200000.00	t
9	Volkswagen	Passat	2021	2000000.00	t
10	Volkswagen	Tiguan	2023	2700000.00	t
11	Kia	Rio	2022	1200000.00	t
12	Kia	Sportage	2023	2300000.00	f
13	Hyundai	Solaris	2021	1150000.00	t
14	Hyundai	Tucson	2023	2400000.00	t
15	Renault	Logan	2022	1100000.00	t
16	Renault	Duster	2023	1900000.00	t
17	Skoda	Octavia	2022	2100000.00	f
18	Skoda	Kodiaq	2023	3100000.00	t
19	Ford	Focus	2021	1500000.00	t
20	Ford	Kuga	2022	2300000.00	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password) FROM stdin;
1	testuser	$2a$08$8w9gB4dA1XjvWa0C9pcQj.C00wUIOWYws9.UUAR2Me92If1zrLpKm
2	testuser2	$2a$08$4BhAcWn87QRmCYk.opN6Meqdwq33plf5TIjtHzmKa6UNmf7GJ5Dhm
\.


--
-- Name: cars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cars_id_seq', 20, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: cars cars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- PostgreSQL database dump complete
--

