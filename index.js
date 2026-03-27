const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
require('dotenv').config();

// Единый секрет для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change-in-production';
console.log('🔑 Используется JWT секрет:', JWT_SECRET);
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '07052004',
  database: process.env.DB_NAME || 'PletnevaVN'
});

pool.on('connect', () => console.log('✅ Подключено к PostgreSQL'));

const initDB = async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password TEXT NOT NULL);`);
  await pool.query(`CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900),
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    available BOOLEAN NOT NULL DEFAULT true
  );`);
  console.log('✅ Таблицы готовы');
};
initDB();

app.use(express.json());

// ====================== ВАЛИДАЦИЯ ======================
const userSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required(),
  password: Joi.string().min(6).required()
});

const carSchema = Joi.object({
  brand: Joi.string().trim().min(2).max(100).required(),
  model: Joi.string().trim().min(2).max(100).required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()+1).required(),
  price: Joi.number().positive().required(),
  available: Joi.boolean().required()
});

const patchCarSchema = Joi.object({
  brand: Joi.string().trim().min(2).max(100),
  model: Joi.string().trim().min(2).max(100),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()+1),
  price: Joi.number().positive(),
  available: Joi.boolean()
}).min(1);

// ====================== JWT ======================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) 
    return res.status(401).json({ message: 'Доступ запрещён. Токен не предоставлен.' });
  try {
    const token = authHeader.split(' ')[1];
    console.log(' Проверка токена:', token.substring(0, 20) + '...'); 
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Неверный или просроченный токен.' });
  }
};

// ====================== АВТОРИЗАЦИЯ ======================
// Регистрация
app.post('/auth/register', async (req, res) => {
  try {
    // Валидация
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    const { username, password } = req.body;

    // Проверка существования пользователя
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Пользователь с таким именем уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const user = result.rows[0];
    
    // Генерация токена
    const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
    );
    console.log('✅ Сгенерирован токен при регистрации:', token);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

// Логин
app.post('/auth/login', async (req, res) => {
  try {
    // Валидация
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    const { username, password } = req.body;

    // Поиск пользователя
    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    // Проверка пароля
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    // Генерация токена
    const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
    );
    console.log('✅ Сгенерирован токен при логине:', token);

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

// Выход (на стороне клиента просто удаляют токен)
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Вы успешно вышли из системы' });
});

// ====================== РУЧКИ CARS ======================
const carRouter = express.Router();
carRouter.use(authenticateToken);

// GET /cars — список
carRouter.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM cars ORDER BY id');
  res.json(result.rows);
});

// GET /cars/:id
carRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
  result.rows.length ? res.json(result.rows[0]) : res.status(404).json({ message: 'Автомобиль не найден' });
});

// POST /cars
carRouter.post('/', async (req, res) => {
  const { error } = carSchema.validate(req.body);
  if (error) return res.status(422).json({ message: error.details[0].message });

  const { brand, model, year, price, available } = req.body;
  const result = await pool.query(
    'INSERT INTO cars (brand, model, year, price, available) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [brand, model, year, price, available]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /cars/:id
carRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { error } = carSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { brand, model, year, price, available } = req.body;
  const result = await pool.query(
    'UPDATE cars SET brand=$1, model=$2, year=$3, price=$4, available=$5 WHERE id=$6 RETURNING *',
    [brand, model, year, price, available, id]
  );
  result.rows.length ? res.json(result.rows[0]) : res.status(404).json({ message: 'Автомобиль не найден' });
});

// PATCH /cars/:id
carRouter.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  // Проверка на пустое тело запроса
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'Тело запроса не может быть пустым' });
  }

  // Валидация с более понятным сообщением
  const { error } = patchCarSchema.validate(req.body);
  if (error) {
    // Проверяем конкретную ошибку "at least 1 key"
    if (error.message.includes('at least 1 key')) {
      return res.status(400).json({ message: 'Должно быть указано хотя бы одно поле для обновления' });
    }
    return res.status(400).json({ message: error.details[0].message });
  }

  // Динамическое построение UPDATE запроса
  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Проверяем каждое поле и добавляем в запрос только если оно есть
  if (req.body.brand !== undefined) {
    updates.push(`brand = $${paramIndex++}`);
    values.push(req.body.brand);
  }
  if (req.body.model !== undefined) {
    updates.push(`model = $${paramIndex++}`);
    values.push(req.body.model);
  }
  if (req.body.year !== undefined) {
    updates.push(`year = $${paramIndex++}`);
    values.push(req.body.year);
  }
  if (req.body.price !== undefined) {
    updates.push(`price = $${paramIndex++}`);
    values.push(req.body.price);
  }
  if (req.body.available !== undefined) {
    updates.push(`available = $${paramIndex++}`);
    values.push(req.body.available);
  }

  // Добавляем id в конец массива значений
  values.push(id);

  // Формируем финальный запрос
  const query = `UPDATE cars SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  try {
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Автомобиль с указанным ID не найден' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении:', err);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

// DELETE /cars/:id
carRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING id', [id]);
  result.rows.length ? res.status(204).send() : res.status(404).json({ message: 'Автомобиль не найден' });
});

app.use('/cars', carRouter);

// 404 и 500
app.use((req, res) => res.status(404).json({ message: 'Ресурс не найден' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));