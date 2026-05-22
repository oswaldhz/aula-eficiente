import psutil
import tkinter as tk
from tkinter import ttk
import time
import threading
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt
from collections import deque

def get_size(bytes):
    """Convert bytes to human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024

class NetMonitorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Internet Usage Monitor")
        self.root.geometry("600x400")
        self.root.configure(bg="#1e1e2f")

        # Styling
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TLabel", background="#1e1e2f", foreground="white", font=("Segoe UI", 12))
        style.configure("Header.TLabel", background="#1e1e2f", foreground="#00c8ff", font=("Segoe UI", 16, "bold"))

        # Labels
        self.header = ttk.Label(root, text="📡 Real-Time Internet Usage", style="Header.TLabel")
        self.header.pack(pady=10)

        self.download_label = ttk.Label(root, text="Download: 0 KB/s")
        self.download_label.pack(pady=5)

        self.upload_label = ttk.Label(root, text="Upload: 0 KB/s")
        self.upload_label.pack(pady=5)

        # Graph setup
        self.fig, self.ax = plt.subplots(figsize=(5, 2.5), dpi=100)
        self.ax.set_facecolor("#2b2b40")
        self.fig.patch.set_facecolor("#1e1e2f") 
        self.ax.tick_params(colors="white")
        self.ax.spines[:].set_color("white")
        self.ax.set_title("Network Speed (KB/s)", color="white")

        self.download_data = deque([0]*30, maxlen=30)
        self.upload_data = deque([0]*30, maxlen=30)
        self.line_download, = self.ax.plot(self.download_data, label="Download", color="#00ff99")
        self.line_upload, = self.ax.plot(self.upload_data, label="Upload", color="#ff007f")
        self.ax.legend(facecolor="#1e1e2f", edgecolor="white", labelcolor="white")

        self.canvas = FigureCanvasTkAgg(self.fig, master=root)
        self.canvas.get_tk_widget().pack(pady=10)

        # Start monitoring
        self.running = True
        threading.Thread(target=self.monitor_network, daemon=True).start()

    def monitor_network(self):
        old_value = psutil.net_io_counters()
        old_sent = old_value.bytes_sent
        old_recv = old_value.bytes_recv

        while self.running:
            time.sleep(1)
            new_value = psutil.net_io_counters()
            new_sent = new_value.bytes_sent
            new_recv = new_value.bytes_recv

            upload_speed = (new_sent - old_sent) / 1024  # KB/s
            download_speed = (new_recv - old_recv) / 1024  # KB/s

            self.download_label.config(text=f"⬇️ Download: {get_size(download_speed*1024)}/s")
            self.upload_label.config(text=f"⬆️ Upload: {get_size(upload_speed*1024)}/s")

            # Update graph
            self.download_data.append(download_speed)#type: ignore
            self.upload_data.append(upload_speed)#type: ignore
            self.line_download.set_ydata(self.download_data)
            self.line_upload.set_ydata(self.upload_data)
            self.line_download.set_xdata(range(len(self.download_data)))
            self.line_upload.set_xdata(range(len(self.upload_data)))
            self.ax.relim()
            self.ax.autoscale_view()

            self.canvas.draw()

            old_sent, old_recv = new_sent, new_recv

    def stop(self):
        self.running = False


if __name__ == "__main__":
    root = tk.Tk()
    app = NetMonitorApp(root)
    root.protocol("WM_DELETE_WINDOW", app.stop)
    root.mainloop()
