# MediCenter-ді SQL Server-мен іске қосу (Windows)

Бір рет баптау шамамен 15 минут алады. Кейін іске қосу үшін тек 6-қадам керек.

## 1. Node.js
https://nodejs.org сайтынан **LTS** нұсқасын (22 немесе одан жоғары) орнатыңыз.

## 2. SQL Server-ге логин мен пароль арқылы кіруді қосу
Сайт SQL Server-ге логин мен құпиясөз арқылы қосылады. Әдепкі бойынша бұл мүмкіндік өшірулі.

1. **SSMS**-ті ашып, бұрынғыдай **Windows Authentication** арқылы қосылыңыз. «Server name» өрісіндегі атауды есте сақтаңыз, мысалы `localhost` немесе `.\SQLEXPRESS`.
2. Сол жақтағы сервер атауына тінтуірдің оң жақ батырмасымен басып, **Properties → Security** бөлімін ашыңыз. **SQL Server and Windows Authentication mode** таңдап, **OK** басыңыз.
3. Сервер атауына қайтадан оң жақ батырмамен басып, **Restart** таңдаңыз.

## 3. Сайтқа арналған логин құру
SSMS-те **New Query** батырмасын басыңыз да, мына мәтінді қойып, **Execute** (F5) басыңыз:

```sql
CREATE LOGIN medicenter WITH PASSWORD = 'Medicenter123!', CHECK_POLICY = OFF;
ALTER SERVER ROLE dbcreator ADD MEMBER medicenter;
```

`dbcreator` рөлі `npm run db:init` командасына `medicenter` дерекқорын өзі құруға рұқсат береді.

## 4. TCP/IP-ді қосу (SQL Server Express үшін міндетті)
1. Бастау мәзірінен **SQL Server Configuration Manager** бағдарламасын ашыңыз. Мәзірден табылмаса, `Win + R` басып, `SQLServerManager16.msc` (SQL Server 2022 үшін) немесе `SQLServerManager15.msc` (2019 үшін) деп жазыңыз.
2. **SQL Server Network Configuration → Protocols for SQLEXPRESS** (немесе MSSQLSERVER) бөлімінде **TCP/IP** жолын **Enabled** етіңіз.
3. **TCP/IP** жолын екі рет басып, **IP Addresses** қойындысының ең төменгі **IPAll** бөліміне өтіңіз. **TCP Dynamic Ports** өрісін бос қалдырып, **TCP Port** өрісіне `1433` деп жазыңыз.
4. **SQL Server Services** бөлімінде **SQL Server (SQLEXPRESS)** жолына оң жақ батырмамен басып, **Restart** таңдаңыз.

## 5. Кодты жүктеп, дерекқорды дайындау
1. https://github.com/elzanbart066-netizen/medicenter бетінде **Code → Download ZIP** басып, архивті ашыңыз.
2. Қалтаны ашып, мекенжай жолына `cmd` деп жазып, Enter басыңыз.
3. Мына екі команданы орындаңыз:

```
npm run setup
npm run db:init
```

Соңында демо аккаунттар кестесі шығуы керек. SSMS-те **Databases** бөлімін жаңартсаңыз (F5), `medicenter` дерекқоры мен оның кестелері көрінеді.

Логин, құпиясөз немесе порт басқа болса, `server\.env.example` файлын `server\.env` деп көшіріп, ішіндегі мәндерді өзгертіңіз.

## 6. Сайтты іске қосу (әр жолы)
1. Бірінші `cmd` терезесінде: `npm run server`
2. Екінші `cmd` терезесінде: `npm run dev`
3. Браузерде **http://localhost:5173** бетін ашыңыз.

Екі терезені де жаппаңыз.

## 7. Кіру
Жоғарғы оң жақтағы **Кіру** батырмасын басып, демо аккаунттың бірін таңдаңыз:

| Рөл | Email | Құпиясөз |
| --- | --- | --- |
| Пациент | patient@medicenter.kz | Patient123! |
| Дәрігер | doctor@medicenter.kz | Doctor123! |
| Клиника әкімшісі | admin@duman.kz | Clinic123! |
| Платформа әкімшісі | admin@medicenter.kz | Admin123! |

## Қате шықса
- **Failed to connect to localhost:1433** шықса, 4-қадам орындалмаған немесе SQL Server қосылмаған.
- **Login failed for user 'medicenter'** шықса, 2-қадамдағы режим қосылмаған немесе сервер қайта іске қосылмаған. 3-қадамды да тексеріңіз.
- **CREATE DATABASE permission denied** шықса, 3-қадамдағы екінші жол орындалмаған.
- **'npm' is not recognized** шықса, Node.js орнатылмаған. Орнатқаннан кейін `cmd` терезесін жауып, қайта ашыңыз.
- Деректерді бастапқы күйге қайтару керек болса: `npm run db:init`
