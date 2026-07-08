from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
# CORS connectivity taaki React UI se direct signals catch ho sakein
CORS(app)

# Windows system file path for internet traffic routing
HOSTS_PATH = r"C:\Windows\System32\drivers\etc\hosts"
REDIRECT_IP = "127.0.0.1"

# Target configuration for blocking entries
SITES_TO_BLOCK = [
    "www.youtube.com", "youtube.com",
    "www.reddit.com", "reddit.com",
    "www.twitter.com", "twitter.com"
]

@app.route('/block', methods=['GET'])
def block_sites():
    try:
        # File operations with explicit UTF-8 encoding for Windows compatibility
        with open(HOSTS_PATH, 'r+', encoding='utf-8') as file:
            content = file.read()
            
            # Logic Break Fix: Ensure file ends with a newline before appending to prevent line corruption
            if content and not content.endswith('\n'):
                file.write('\n')
                
            for site in SITES_TO_BLOCK:
                if site not in content:
                    file.write(f"{REDIRECT_IP} {site}\n")
                    
        return jsonify({"status": "Success", "message": "Focus Mode ON: Distractions Blocked!"})
    except PermissionError:
        return jsonify({"status": "Error", "message": "Access Denied! Run Cursor as Administrator."})
    except Exception as e:
        return jsonify({"status": "Error", "message": f"Unexpected System Error: {str(e)}"})

@app.route('/unblock', methods=['GET'])
def unblock_sites():
    try:
        with open(HOSTS_PATH, 'r+', encoding='utf-8') as file:
            lines = file.readlines()
            file.seek(0) # Pointer reset to overwrite file safely
            
            for line in lines:
                # Retain only non-blocked entries
                if not any(site in line for site in SITES_TO_BLOCK):
                    file.write(line)
            file.truncate() # Clear remaining old buffer text
            
        return jsonify({"status": "Success", "message": "Focus Mode OFF: Websites Allowed!"})
    except PermissionError:
        return jsonify({"status": "Error", "message": "Access Denied! Run Cursor as Administrator."})
    except Exception as e:
        return jsonify({"status": "Error", "message": f"Unexpected System Error: {str(e)}"})

if __name__ == '__main__':
    # Local controller tracking on Port 5000
    app.run(port=5000, debug=True)