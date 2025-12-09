# User Onboarding Guide
## How to Configure Claude Desktop for Hudu MCP

**Time required:** 5 minutes

---

## Step 1: Get Your Access Token (2 minutes)

1. **Open your browser** and visit:
   ```
   https://mcp.hudu.247mgmt.com/token
   ```

2. **Login with your work credentials:**
   - You'll be redirected to Microsoft login
   - Use your Wheelhouse IT email and password
   - May require MFA if enabled

3. **Copy your token:**
   - You'll see a page with your personal access token
   - Click the **"Copy Token to Clipboard"** button
   - The token will be copied automatically

✅ **Success:** You now have your personal access token!

---

## Step 2: Configure Claude Desktop (3 minutes)

### For Windows Users:

1. **Open File Explorer** and navigate to:
   ```
   %APPDATA%\Claude
   ```

   **Tip:** Copy and paste the path above into the File Explorer address bar

2. **Find or create the file:** `claude_desktop_config.json`
   - Right-click → New → Text Document
   - Name it: `claude_desktop_config.json`

3. **Open the file** with Notepad

4. **Paste this configuration:**
   ```json
   {
     "mcpServers": {
       "hudu": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://mcp.hudu.247mgmt.com/mcp",
           "--header",
           "Authorization: Bearer ${HUDU_MCP_TOKEN}"
         ],
         "env": {
           "HUDU_MCP_TOKEN": "PASTE_YOUR_TOKEN_HERE"
         }
       }
     }
   }
   ```

5. **Replace `PASTE_YOUR_TOKEN_HERE`** with your actual token from Step 1
   - Delete `PASTE_YOUR_TOKEN_HERE`
   - Press `Ctrl+V` to paste your token
   - Keep the quotes around the token

6. **Save the file:**
   - File → Save
   - Close Notepad

---

## Step 3: Restart Claude Desktop

1. **Close Claude Desktop** completely
   - Right-click Claude in system tray → Exit
   - Or use Task Manager to end the process

2. **Start Claude Desktop** again

3. **Verify MCP tools are available:**
   - Open a new chat in Claude
   - Type: "What Hudu tools are available?"
   - Claude should list Hudu MCP tools

✅ **Success:** You can now use Hudu data in Claude Desktop!

---

## Testing Your Setup

Try these commands in Claude Desktop to test:

**1. List all companies:**
```
Show me all companies in Hudu
```

**2. Search for a specific company:**
```
Search Hudu for "Bonnet House"
```

**3. Get company assets:**
```
Show me all assets for Bonnet House
```

**Expected:** Claude should query Hudu and return results!

---

## Troubleshooting

### Problem: Claude says "I don't have access to Hudu tools"

**Solution:**
1. Verify `claude_desktop_config.json` is in the correct location:
   - `%APPDATA%\Claude\claude_desktop_config.json`
2. Check JSON syntax is correct (no missing commas or brackets)
3. Verify token is pasted correctly (no extra spaces)
4. Restart Claude Desktop

---

### Problem: "Authentication failed" error

**Solution:**
1. Your token may have expired (tokens last 7 days)
2. Visit `https://mcp.hudu.247mgmt.com/token` to get a new token
3. Update `HUDU_MCP_TOKEN` in your config file
4. Restart Claude Desktop

---

### Problem: Config file won't save

**Solution:**
1. Make sure file extension is `.json` (not `.json.txt`)
2. In Notepad: File → Save As → Save as type: "All Files (*.*)"
3. Type filename: `claude_desktop_config.json`

---

## Token Security

**Important:**
- ✅ Your token is personal to you - don't share it
- ✅ Tokens automatically expire after 7 days for security
- ✅ You can get a new token anytime from the token portal
- ✅ If you suspect your token is compromised, contact your admin

---

## Need Help?

**Can't access token portal?**
- Verify you're connected to the internal network
- Contact your IT administrator

**Claude Desktop issues?**
- Check Claude Desktop is up to date
- Try restarting your computer
- Contact your IT administrator

**Hudu data questions?**
- Check which companies/assets you have access to
- Contact your IT administrator for access requests

---

## Quick Reference

**Token Portal:** `https://mcp.hudu.247mgmt.com/token`
**Config File Location:** `%APPDATA%\Claude\claude_desktop_config.json`
**Token Validity:** 7 days
**Support:** Contact your IT administrator

---

**Happy querying!** 🚀
