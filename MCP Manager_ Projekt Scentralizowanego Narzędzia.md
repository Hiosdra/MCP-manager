# **Projekt Architektury i Plan Implementacji: Centralny Menedżer Model Context Protocol (MCP)**

## **Wprowadzenie i Kontekst Architektoniczny**

Ekosystem Model Context Protocol (MCP) znajduje się obecnie w fazie intensywnego rozwoju, co skutkuje głęboką fragmentacją mechanizmów integracji po stronie klientów sztucznej inteligencji. Środowiska takie jak Claude Desktop, Cursor, różnorodne rozszerzenia do Visual Studio Code (np. Cline, Roo Code), OpenCode czy zintegrowane środowiska programistyczne JetBrains wymagają zarządzania własnymi, niezależnymi plikami konfiguracyjnymi.

Taka architektura prowadzi do rozproszenia konfiguracji i zmiennych środowiskowych. Konieczność wprowadzania wrażliwych kluczy API do wielu osobnych plików konfiguracyjnych JSON, YAML i XML, rozrzuconych po całym systemie plików, stanowi problem organizacyjny i naruszenie zasad wygody pracy. W odpowiedzi na te wyzwania, niniejszy dokument prezentuje kompleksowy projekt scentralizowanego narzędzia zarządzającego – "MCP Manager". Narzędzie to, działające w modelu *Config Synchronizer*, ma za zadanie zunifikować proces wprowadzania danych, umożliwiając deweloperowi definiowanie serwerów w jednym miejscu, a następnie automatyczne propagowanie (synchronizowanie) tych definicji do wszystkich docelowych narzędzi AI w systemie.

## **Analiza Architektury: Wybór Optymalnego Podejścia**

Zaprojektowanie scentralizowanego narzędzia zarządzającego wymagało wyboru pomiędzy dwiema fundamentalnie różnymi architekturami systemowymi. Zgodnie z decyzją projektową, opieramy się na pierwszym, lżejszym podejściu.

### **Podejście A: Mechanizm Config Synchronizer (Wybrane)**

Podejście opierające się na synchronizacji konfiguracji zakłada stworzenie aplikacji działającej jako inteligentny menedżer plików i repozytorium ustawień. Aplikacja ta utrzymuje jedną główną bazę konfiguracji (tzw. Single Source of Truth) i operuje bezpośrednio na systemie plików użytkownika. Jej głównym zadaniem jest automatyczne wstrzykiwanie i nadpisywanie definicji narzędzi w dedykowanych plikach konfiguracyjnych poszczególnych klientów AI (np. mcp.json, opencode.json czy plikach XML).

**Zalety tego podejścia:**

* **Bezstanowość w warstwie sieciowej:** Narzędzie w ogóle nie ingeruje w protokół sieciowy ani w warstwę transportową MCP. Po zsynchronizowaniu plików menedżer może zostać całkowicie zamknięty, a ekosystem będzie funkcjonował natywnie.  
* **Wykorzystanie natywnych funkcji klientów:** To docelowe środowiska samodzielnie zarządzają cyklem życia procesów potomnych. Gwarantuje to maksymalną stabilność i natywne wsparcie dla powiązanych mechanizmów (np. rozwiązywania kolizji nazw, z czym klienci świetnie sobie radzą).  
* **Prostota implementacyjna:** Odpada konieczność budowy skomplikowanego routera obsługującego strumienie Server-Sent Events (SSE) i mostki standardowego wejścia/wyjścia (stdio).

Chociaż podejście to akceptuje redundancję pamięciową (jeśli trzy aplikacje mają zsynchronizowany ten sam serwer, system operacyjny uruchomi trzy instancje procesów), jest to świadomy kompromis na rzecz absolutnej niezawodności i kompatybilności.

## **Mapowanie Ekosystemu Klientów AI i Badanie Ścieżek**

Ekosystem wykazuje obecnie bardzo wysoki poziom fragmentacji plików konfiguracyjnych. Menedżer musi obsługiwać precyzyjne mapowanie dla każdego z narzędzi na wszystkich systemach operacyjnych. Poniższa tabela systematyzuje domyślne ścieżki dostępu:

| Rodzina Klienta AI | Środowisko Operacyjne | Fizyczna Lokalizacja Konfiguracji (Globalna) | Format Danych |
| :---- | :---- | :---- | :---- |
| **Claude Desktop** | macOS / Linux | \~/Library/Application Support/Claude/claude\_desktop\_config.json (Mac), \~/.config/Claude/claude\_desktop\_config.json (Linux) | JSON |
| **Claude Desktop** | Windows | %APPDATA%\\Claude\\claude\_desktop\_config.json | JSON |
| **Cursor** | macOS / Win / Linux | \~/.cursor/mcp.json lub %USERPROFILE%\\.cursor\\mcp.json | JSON |
| **Windsurf IDE** | macOS / Win / Linux | \~/.codeium/windsurf/mcp\_config.json | JSON |
| **Zed Editor** | macOS / Linux | \~/.config/zed/settings.json | JSON |
| **Continue.dev** | macOS / Win / Linux | \~/.continue/config.yaml lub .continue/mcpServers/ | YAML / JSON |
| **Sourcegraph Cody** | macOS / Win / Linux | \~/.config/cody/mcp\_servers.json | JSON |
| **Goose (Block)** | macOS / Win / Linux | \~/.config/goose/config.yaml | YAML |
| **OpenCode AI** | Cross-platform | \~/.config/opencode/opencode.json | JSONC |
| **VS Code (Cline/Roo)** | macOS / Windows | %APPDATA%\\Code\\User\\globalStorage\\rooveterinaryinc.roo-cline\\settings\\cline\_mcp\_settings.json | JSON |
| **JetBrains (IntelliJ)** | Cross-platform | \~/Library/Application Support/JetBrains/IntelliJIdea2025.2/options/llm.mcpServers.xml | XML |

## **Rozszerzone Mapowanie: Schematy i Przykłady Konfiguracji**

Każde z narzędzi wdrożyło standard MCP w nieco inny sposób. Aby silnik synchronizujący "MCP Managera" działał prawidłowo, musi generować kod ściśle dopasowany do schematów poniższych klientów.

### **1\. Standardowy format rynkowy (Claude Desktop, Cursor, Windsurf, Cline)**

Większość narzędzi opiera się na pierwotnym schemacie zdefiniowanym przez Anthropic. Obiekt nadrzędny to mcpServers, w którym kluczem jest nazwa serwera. Obsługują transport stdio (wymagający podania command, args i env).

JSON

{  
  "mcpServers": {  
    "my-postgres-server": {  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"\],  
      "env": {  
        "PGPASSWORD": "secret\_password"  
      }  
    }  
  }  
}

### **2\. Zed Editor**

Edytor Zed przechowuje konfigurację w swoim głównym pliku settings.json. Zamiast standardowego węzła, używa klucza context\_servers. Co więcej, pole komendy musi znajdować się w głębszym zagnieżdżeniu (czasem opisywane jako struktura command: { path: "npx", args: } lub standardowo w zależności od wersji). Menedżer musi uważać, by przy modyfikacji tego pliku nie zepsuć reszty ustawień edytora.

JSON

{  
  "context\_servers": {  
    "my-postgres-server": {  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"\],  
      "env": {  
        "PGPASSWORD": "secret\_password"  
      }  
    }  
  },  
  "theme": "One Dark"   
}

### **3\. Continue.dev**

Popularne rozszerzenie Continue.dev odeszło od formatu JSON na rzecz czytelnego YAML (config.yaml). Wymusza użycie struktury listy (tablicy) dla klucza mcpServers, gdzie każdy element musi posiadać zdefiniowany name.

YAML

name: My Config  
version: 1.0.0  
schema: v1  
mcpServers:  
  \- name: my-postgres-server  
    command: npx  
    args:  
      \- "-y"  
      \- "@modelcontextprotocol/server-postgres"  
      \- "postgresql://localhost/mydb"  
    env:  
      PGPASSWORD: "secret\_password"

### **4\. OpenCode AI**

Narzędzie to wymusza plik w formacie JSONC (pozwalającym na komentarze). Różni się znacząco semantyką – transport stdio określa się atrybutem "type": "local", a komenda i argumenty są często łączone w jedną tablicę command. Zmienne środowiskowe umieszcza się pod kluczem environment (zamiast powszechnego env).

Code snippet

{  
  "$schema": "https://opencode.ai/config.json",  
  "mcp": {  
    "my-postgres-server": {  
      "type": "local",  
      "command": \["npx", "-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"\],  
      "environment": {  
        "PGPASSWORD": "secret\_password"  
      },  
      "enabled": true  
    }  
  }  
}

### **5\. Sourcegraph Cody**

Integracja w Sourcegraph Cody używa specyficznego dla siebie klucza głównego cody.mcpServers (lub mcpServers w zależności od środowiska) w pliku mcp\_servers.json. Konstrukcja jest podobna do Claude, jednak zdefiniowanie prefiksu bywa kluczowe dla poprawności działania.

JSON

{  
  "cody.mcpServers": {  
    "my-postgres-server": {  
      "command": "npx",  
      "args": \["-y", "@modelcontextprotocol/server-postgres"\],  
      "env": {}  
    }  
  }  
}

### **6\. Goose (od Block)**

Goose, zyskujący na popularności lokalny agent CLI, traktuje serwery MCP jako tzw. "rozszerzenia" (extensions) w swoim pliku konfiguracyjnym YAML. Menedżer musi wpisywać dane do węzła extensions.

YAML

extensions:  
  my-postgres-server:  
    cmd: npx  
    args:  
      \- "-y"  
      \- "@modelcontextprotocol/server-postgres"  
    envs:  
      PGPASSWORD: "secret\_password"

### **7\. JetBrains AI Assistant (IntelliJ)**

Największe wyzwanie implementacyjne. Ekosystem ten mapuje konfiguracje do wysoce specyficznego dokumentu XML. Dodawanie serwera przez aplikację Menedżera wymaga użycia zaawansowanego parsera XML. 1

XML

\<application\>  
  \<component name\="llm.mcpServers"\>  
    \<server name\="my-postgres-server"\>  
      \<command\>npx\</command\>  
      \<args\>\-y @modelcontextprotocol/server-postgres\</args\>  
      \</server\>  
  \</component\>  
\</application\>

## **Wybór Stosu Technologicznego i Architektury Aplikacji**

Zgodnie z wymogiem oparcia całego ekosystemu wyłącznie na języku JavaScript, do budowy stacjonarnego menedżera synchronizującego konfiguracje wybrany zostaje framework **Electron w połączeniu z Node.js dla zaplecza oraz React/TypeScript dla interfejsu**.

### **Uzasadnienie wyboru technologii (100% JavaScript Stack):**

1. **Zunifikowane Środowisko Programistyczne:** Pisanie zarówno interfejsu graficznego (Renderer Process), jak i zaplecza operującego na plikach (Main Process) w jednym języku (TypeScript/JavaScript) drastycznie przyspiesza proces deweloperski. Logika walidacji schematów konfiguracyjnych może być łatwo współdzielona pomiędzy frontendem a backendem.  
2. **Potęga Ekosystemu NPM dla formatów plików:** Biorąc pod uwagę zaprezentowaną wyżej różnorodność formatów (JSON, zagnieżdżony JSONC z komentarzami, YAML dla Continue i Goose oraz XML dla JetBrains), dostęp do ogromnego repozytorium NPM jest nieoceniony. Pozwala na użycie sprawdzonych narzędzi (takich jak jsonc-parser, yaml czy xml2js), które potrafią modyfikować drzewo składniowe bez niszczenia formatowania.  
3. **Zarządzanie Pamięcią poprzez Procesy w Tle:** Mimo powszechnej opinii o zasobożerności frameworka Electron, w modelu "Config Synchronizer" (Podejście A) aplikacja może być całkowicie zamknięta zaraz po zsynchronizowaniu plików, dzięki czemu nie "okupuje" pamięci RAM w trakcie codziennej pracy programisty w IDE.

Warstwa widoków (Frontend) zostanie zbudowana za pomocą React 18 i Vite, co przy zastosowaniu biblioteki Tailwind CSS pozwoli na stworzenie natywnie wyglądającego i wysoce responsywnego interfejsu (UI). Komunikacja między oknem aplikacji a systemem operacyjnym odbędzie się przez standardowy most IPC Electrona (ipcMain / ipcRenderer).

## **Projekt Interfejsu Użytkownika i Optymalizacja Przepływu Pracy (UI/UX)**

Interfejs graficzny Menedżera skupia się na prostej i bezpiecznej dystrybucji ustawień pomiędzy dziesiątkami zmapowanych klientów.

### **Architektura Informacji i Główne Widoki**

1. **Dashboard: Biblioteka Serwerów (Master Repository)**  
   Centralny punkt aplikacji, który wylistuje wszystkie serwery MCP skonfigurowane w głównej bazie Menedżera. Użytkownik widzi tu kafelki reprezentujące serwery. Każdy serwer posiada status określający, do ilu zewnętrznych narzędzi AI (klientów) został obecnie "wstrzyknięty".  
2. **Formularz Konfiguracyjny (Add/Edit Server)**  
   Widok służący do definiowania nowego serwera. Składa się z:  
   * **Typu Transportu:** Wybór pomiędzy serwerem odpalanym z polecenia (Local/Stdio) a serwerem chmurowym (Remote/SSE).  
   * **Definicji Komendy:** Pola na komendę wykonawczą (np. npx, python) i listę argumentów.  
   * **Zarządzania Zmiennymi (Secrets Vault):** Ważny moduł pozwalający wpisać klucze API. Menedżer przechowuje je w lokalnej bazie SQLite i dynamicznie tłumaczy na właściwy klucz docelowy (np. mapując na klucz env, environment dla OpenCode lub envs dla Goose).  
3. **Centrum Synchronizacji (Sync Hub / Integrations)**  
   Zakładka z prawej strony ekranu, wyświetlająca logotypy wszystkich obsługiwanych klientów w systemie (Claude, Cursor, Zed, Windsurf, Continue, OpenCode, Goose, Cody, JetBrains). Przełączniki obok każdej ikony pozwalają jednym kliknięciem aktywować automatyczne modyfikowanie ich lokalnych plików.

## **Plan Implementacji Krok po Kroku (Roadmapa Wdrożeniowa Systemu)**

Realizacja podzielona jest na cztery skoncentrowane fazy.

| Faza | Zarys Operacyjny | Szczegółowe Definicje Zadań Deweloperskich (JavaScript/Node.js) |
| :---- | :---- | :---- |
| **Faza 1** | **Opracowanie inteligentnych parserów formatów (Node.js Core Sync Engine)** | 1\. Integracja biblioteki yaml do odczytu i bezstratnego zapisu plików dla klientów Continue.dev i Goose. 2\. Implementacja bezstratnego parsera dla plików JSONC (z zachowaniem komentarzy użytkownika) z wykorzystaniem biblioteki jsonc-parser dla środowiska OpenCode (opencode.json) oraz zawiłego w ustawienia edytora Zed (settings.json). 3\. Implementacja adaptera dla środowiska JetBrains wykorzystującego pakiet do manipulacji XML (xml2js). |
| **Faza 2** | **Budowa Aplikacji Desktopowej i Głównego Interfejsu (Electron \+ React)** | 1\. Inicjalizacja środowiska Electron. Skonfigurowanie Main Process do obsługi operacji dyskowych i podpięcie lokalnej bazy better-sqlite3. 2\. Zbudowanie front-endu w React/Tailwind. Implementacja dynamicznego formularza dodawania serwera. 3\. Skonfigurowanie zabezpieczonego mostka preload.js (ContextBridge) pomiędzy oknem aplikacji a systemem. |
| **Faza 3** | **Zbudowanie Wzorców Tłumaczeń (Client Integration Adapters)** | 1\. Napisanie klas tłumaczących generyczny obiekt bazy na specyficzne schematy (tzw. "Translatory Schematów"). Np. Translator dla Zed musi zagnieździć obiekt pod context\_servers, Translator dla OpenCode musi przepakować tablicę zmiennych do słownika environment oraz połączyć argumenty z poleceniem w jedno pole tablicowe command. 2\. Wdrożenie asynchronicznego skanera ścieżek, automatycznie wykrywającego klientów w katalogach systemowych (jak wyszukiwanie ukrytego .continue/config.yaml). |
| **Faza 4** | **Stabilizacja Wersji i Obsługa Błędów Brzegowych (Release v1.0)** | 1\. Zaimplementowanie modułu natywnego backupu plików wykonywanego przy użyciu asynchronicznego fs.copyFile tworzącego kopie zapasowe docelowych plików (np. config.yaml.backup) bezpośrednio przed mutacją węzła. 2\. Wdrożenie systemu powiadomień UI o konieczności ręcznego restartu modyfikowanych IDE. |

## **Zarządzanie Przypadkami Brzegowymi i Inżynieria Niezawodności (Edge Cases)**

Model synchronizacji plików całkowicie niweluje problem utrzymywania podprocesów (np. zombie processes), ale wprowadza wyzwania operacyjne na systemie plików.

### **Zniszczenie Komentarzy w Plikach JSONC i YAML (Zed, OpenCode, Continue)**

Zaawansowane edytory (takie jak Zed czy OpenCode) oraz narzędzia CLI (Goose) opierają się na dokumentach, w których programiści pozostawiają własne komentarze formatujące (składnia .jsonc i .yaml). Wykorzystanie wbudowanych w V8 metod JSON.parse() i JSON.stringify() bezpowrotnie zniszczyłoby formatowanie, wcięcia oraz wszystkie notatki użytkownika.

* **Rozwiązanie w Architekturze:** Pętla zapisu (Main Process w Electronie) musi bezwzględnie unikać natywnej serializacji w Node.js dla formatów mieszanych. Zamiast tego zaimplementowana zostanie dedykowana biblioteka jsonc-parser od Microsoftu do precyzyjnego mutowania specyficznych węzłów (Abstract Syntax Tree) w plikach .jsonc (jak Zed i OpenCode) oraz analogiczna biblioteka zachowująca drzewo AST dla plików YAML (Continue.dev, Goose).

### **Kolizja Zmiennych Środowiskowych a Różne Formaty**

Ze względu na różnice w formatach (np. Zed oczekuje env, OpenCode oczekuje environment, a Goose oczekuje envs), prymitywne wstrzykiwanie tych samych obiektów spowoduje ciche awarie serwerów podczas uruchamiania poszczególnych edytorów.

* **Rozwiązanie w Architekturze:** Moduł Translacji (Faza 3\) przed każdorazowym wysłaniem pakietu do zapisu, "przepakowuje" główny, ujednolicony słownik kluczy sekretów utworzony przez użytkownika i dynamicznie podmienia jego etykiety (keys) w zależności od docelowego odbiorcy.

### **Kolizja i Zabezpieczenie Blokady Plików (File Locking na systemach Windows)**

Na systemach z rodziny Windows aplikacje często otwierają pliki konfiguracyjne z agresywnym żądaniem wyłącznego dostępu na czas działania. Jeśli dany edytor w tle czyta swój plik (np. claude\_desktop\_config.json), asynchroniczna próba zapisu z Managera rzuci krytycznym błędem EPERM (Odmowa Dostępu).

* **Rozwiązanie w Architekturze:** Pętla zapisująca zaimplementuje wzorzec "Retry z wykładniczym opóźnieniem" (Exponential Backoff Pattern). Aplikacja podejmie 3 próby z opóźnieniem timera. Jeśli blokada nie ustąpi, Manager zrezygnuje z nadpisywania i wyśle do widoku React czytelny alert dla użytkownika: "Aplikacja docelowa blokuje plik. Zamknij ją całkowicie na czas synchronizacji".

### **Usterka Argumentów Ścieżek z Białymi Znakami w środowiskach JetBrains (IntelliJ XML Bug)**

Klienci AI od producenta JetBrains wymuszają przechowywanie swoich deklaracji w wysoce specyficznym środowisku XML. Znany jest błąd parserów polegający na tym, że ścieżka pliku ze spacją powoduje nieprawidłowe podzielenie argumentów podczas odpalania procesu MCP przez samo IDE.

* **Rozwiązanie w Architekturze:** Adapter formatu XML dla JetBrains zastosuje zautomatyzowaną prewencyjną "sanitaryzację". Używając JavaScript, skrypt sprawdzi ciągi przesyłane do XML w polu poleceń. Jeśli ścieżka zawiera spacje, opakuje ją w zabezpieczające sekwencje znaków cudzysłowu lub zgłosi bezpośrednie ostrzeżenie o niemożliwości synchronizacji ścieżki w tym konkretnym IDE.

#### **Works cited**

1. Model Context Protocol (MCP) | AI Assistant Documentation \- JetBrains, accessed March 9, 2026, [https://www.jetbrains.com/help/ai-assistant/mcp.html](https://www.jetbrains.com/help/ai-assistant/mcp.html)  
2. MCP Server | IntelliJ IDEA Documentation \- JetBrains, accessed March 9, 2026, [https://www.jetbrains.com/help/idea/mcp-server.html](https://www.jetbrains.com/help/idea/mcp-server.html)