import schedule
import time
from datetime import datetime
from batch_processor import process_all_indices
import logging

# Setup logging
logging.basicConfig(
    filename="/Users/DSJP/Desktop/CODE/BT/python/logs/scheduled_updates.log",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def update_job():
    """Daily update job"""
    logging.info("Starting scheduled update")
    print(f"Starting scheduled update at {datetime.now()}")
    
    try:
        # Set force_update to True to force update all stocks
        results = process_all_indices(force_update=True)
        logging.info(f"Update completed: {results}")
    except Exception as e:
        logging.error(f"Error in scheduled update: {e}")
        
    print(f"Update completed at {datetime.now()}")

# Schedule the job to run daily at 6:00 AM
schedule.every().day.at("06:00").do(update_job)

if __name__ == "__main__":
    print("Starting scheduled update service")
    logging.info("Scheduled update service started")
    
    # Run once at startup
    update_job()
    
    # Keep running to execute scheduled jobs
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute