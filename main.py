# -*- coding: utf-8 -*-

from app import app, bind_port
import datavis

if __name__ == "__main__":
    # Start the web server
    app.run(debug=True, host='0.0.0.0', port=bind_port)
