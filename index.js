import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import ConnectSqlite3 from 'connect-sqlite3';

import v1ApiRoutes from './src/api/v1.js'; 
import adminRoutes from './src/api/admin.js';
import publicRoutes from './src/api/publicRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(express.static(path.join(__dirname, 'src', 'public')));

const SQLiteStore = ConnectSqlite3(session);
app.use(session({
    store: new SQLiteStore({
        db: 'dev.db', 
        dir: './prisma', 
        table: 'sessions' 
    }),
    secret: 'MhProCodeDeveloper', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } 
}));


app.use('/', publicRoutes);
app.use('/api/v1', v1ApiRoutes);
app.use('/admin', adminRoutes); 

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});