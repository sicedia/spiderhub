# Installing GNU Gettext on Windows

## Problem

Django translation files (`.po`) need to be compiled to binary format (`.mo`) for translations to work. The command `python manage.py compilemessages` requires **GNU gettext tools** installed on the system.

## Current Error

```
CommandError: Can't find msgfmt. Make sure you have GNU gettext tools 0.19 or newer installed.
```

Or if compiled with custom script:
```
UnicodeDecodeError: 'ascii' codec can't decode byte 0xc3 in position 13
```

## Solutions

### Option 1: Installation with Chocolatey (Recommended)

If you have [Chocolatey](https://chocolatey.org/) installed:

```powershell
# As administrator
choco install gettext -y
```

After installing, close and reopen terminal, then:

```powershell
# Activate virtual environment
.\pyspider\Scripts\Activate.ps1

# Compile messages
python manage.py compilemessages

# Restart server
python manage.py runserver 8001
```

### Option 2: Manual Download (Simpler)

1. **Download gettext for Windows**:
   - Go to: https://mlocati.github.io/articles/gettext-iconv-windows.html
   - Download the "static" version (64-bit)
   - Or use this direct link: https://github.com/mlocati/gettext-iconv-windows/releases

2. **Extract the files**:
   - Unzip the file
   - Copy all contents to a folder, e.g.: `C:\gettext`

3. **Add to PATH**:
   - Search "Edit the system environment variables" in Windows
   - Click "Environment Variables"
   - In "System variables", select "Path" and click "Edit"
   - Click "New" and add: `C:\gettext\bin` (or the path where you copied)
   - Click "OK" in all windows

4. **Verify installation**:
   ```powershell
   # Open a NEW terminal
   msgfmt --version
   
   # You should see something like:
   # msgfmt (GNU gettext-tools) 0.21
   ```

5. **Compile messages**:
   ```powershell
   cd C:\Projects\spiderhub_web
   .\pyspider\Scripts\Activate.ps1
   python manage.py compilemessages
   ```

### Option 3: Use Custom Scripts (Temporary)

If you can't install gettext, you can use our Python scripts:

```powershell
# This script does NOT currently work due to issues with Python 3.13
# python scripts\compile_po.py
```

**⚠️ Problem**: Custom scripts generate .mo files that Python 3.13 can't read correctly due to an encoding bug on Windows.

### Option 4: WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# In WSL
cd /mnt/c/Projects/spiderhub_web
source pyspider/bin/activate  # or correct path of your venv
python manage.py compilemessages
```

## Verification

After successfully compiling, you should see:

```
processing file locale\es\LC_MESSAGES\django.po
processing file locale\pt\LC_MESSAGES\django.po
```

And the created `.mo` files:
```
locale/
├── es/
│   └── LC_MESSAGES/
│       ├── django.po
│       └── django.mo  ← Compiled file
├── pt/
│   └── LC_MESSAGES/
│       ├── django.po
│       └── django.mo  ← Compiled file
```

## Current Project Status

**Without compiled .mo files:**
- ✅ Multilingual system is configured
- ✅ Templates have translation marks ({% trans %})
- ✅ Models use gettext_lazy
- ✅ Language selector works
- ⚠️ Texts appear in English because .mo files are missing

**With compiled .mo files:**
- ✅ All texts translate automatically
- ✅ 219+ messages available in Spanish
- ✅ System 100% functional in ES, EN, PT

## Quick Testing

Once messages are compiled:

```powershell
# Start server
python manage.py runserver 8001

# Open in browser:
# http://localhost:8001/es/   ← Should show everything in Spanish
# http://localhost:8001/en/   ← Everything in English
# http://localhost:8001/pt/   ← Portuguese (when translated)
```

## Troubleshooting

### Error: "Can't find msgfmt"
- gettext is not installed or not in PATH
- Solution: Follow Option 1 or 2 above

### Error: "UnicodeDecodeError"
- .mo file has encoding problems
- Solution: Delete .mo and recompile with official gettext
```powershell
Remove-Item locale\es\LC_MESSAGES\django.mo -Force
python manage.py compilemessages
```

### Translations don't appear
1. Verify that `locale/es/LC_MESSAGES/django.mo` exists
2. Restart Django server
3. Clear browser cache (Ctrl+F5)
4. Verify URL has correct prefix: `/es/`

## Resources

- **Django i18n docs**: https://docs.djangoproject.com/en/5.2/topics/i18n/
- **Gettext Windows**: https://mlocati.github.io/articles/gettext-iconv-windows.html
- **Chocolatey**: https://chocolatey.org/

## Contact

For installation support, contact the development team.
