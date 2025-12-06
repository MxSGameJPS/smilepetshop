import React from "react";
import Sidebar from "./sidebar/sidebar";
import styles from "./dashboard.module.css";

export default function Dashboard({ children }) {
  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>{children}</div>
      </main>
    </div>
  );
}
