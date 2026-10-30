# MediCenter-ді интернетке шығару (тегін)

Сайт **Render**-де, дерекқор **Azure SQL Database**-те тұрады. Компьютер өшіп тұрса да, сайт жұмыс істей береді.

Тегін нұсқаның шектеулері:
- Render сайты 15 минут бойы ешкім кірмесе ұйықтайды. Келесі адам кіргенде ол шамамен 1 минут ішінде оянады.
- Azure SQL тегін дерекқоры да ұзақ уақыт қолданылмаса тоқтап тұрады. Бірінші сұраныс сәл баяу орындалады.

## 1. Azure SQL дерекқоры
1. https://azure.microsoft.com/free/students сайтында студенттік email арқылы тіркеліңіз (карта сұралмайды). Студенттік пошта болмаса, https://azure.microsoft.com/free сайтын қолданыңыз.
2. https://portal.azure.com порталында іздеу жолына **SQL databases** деп жазып, **Create** басыңыз.
3. Беттің жоғарғы жағындағы **Apply offer** («Want to try Azure SQL Database for free?») батырмасын басыңыз.
4. Өрістерді толтырыңыз:
   - **Resource group:** Create new → `medicenter`
   - **Database name:** `medicenter`
   - **Server:** Create new
     - Server name: мысалы, `medicenter-yel11` (бірегей болуы керек)
     - Location: (Europe) West Europe немесе өзіңізге жақын аймақ
     - Authentication method: **Use SQL authentication**
     - Server admin login: `medicenteradmin`
     - Password: күрделі пароль ойлап табыңыз да, **жазып алыңыз**
   - **Behavior when free limit reached:** Auto-pause the database until next month
5. **Networking** қойындысы:
   - Connectivity method: **Public endpoint**
   - **Allow Azure services and resources to access this server:** Yes
   - **Add current client IP address:** Yes
6. **Review + create → Create** басыңыз. Дайын болуы 2–3 минут алады.
7. **Go to resource** басыңыз. **Server name** өрісіндегі `medicenter-yel11.database.windows.net` сияқты атауды көшіріп алыңыз.
8. Сол жақ мәзірден серверді ашып (**Server name** сілтемесі), **Security → Networking** бөлімінде **+ Add a firewall rule** басыңыз. Мәндері: аты `render`, Start IP `0.0.0.0`, End IP `255.255.255.255`. **Save** басыңыз. Render сайтының IP мекенжайы тұрақты емес, сондықтан осылай рұқсат беру керек. Дерекқор бәрібір құпиясөзбен қорғалған.

## 2. Render-дегі сайт
1. https://render.com сайтында **GitHub** арқылы тіркеліңіз.
2. **New → Blueprint** басып, `medicenter` репозиторийін таңдаңыз (Render-ге GitHub-қа кіруге рұқсат беріңіз).
3. Render үш мәнді сұрайды:
   - `DB_SERVER`: 1.7-қадамдағы атау, мысалы `medicenter-yel11.database.windows.net`
   - `DB_USER`: `medicenteradmin`
   - `DB_PASSWORD`: 1.4-қадамдағы пароль
4. **Apply** басыңыз. Бірінші жинақ 3–5 минут алады.
5. Дайын болғанда сайттың сілтемесі жоғарыда шығады: `https://medicenter-xxxx.onrender.com`. Алғашқы іске қосу кезінде сервер дерекқордағы кестелер мен демо деректерді өзі құрады.

Бұл сілтемені кез келген адамға жіберуге болады, телефоннан да ашылады.

## Жаңарту
GitHub-тағы `main` тармағы өзгерген сайын Render сайтты автоматты түрде қайта жинайды.

## Қате шықса
Render-дегі сервис бетінде **Logs** бөлімін ашыңыз:
- `Login failed` шықса, `DB_USER` немесе `DB_PASSWORD` қате енгізілген. **Environment** бөлімінде түзетіңіз.
- `is not allowed to access the server` шықса, 1.8-қадамдағы firewall ережесі қосылмаған.
- `Database check failed` шықса, дерекқор әлі ұйықтап тұр. 1 минут күтіп, Render-де **Manual Deploy → Restart** басыңыз.
