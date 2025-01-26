import React, { useState } from 'react';
import config from '../../config/config.local';

const { LOOKER_URL } = config;

const Chart = () => 
    <div style={{width: "100%"}}>
      <iframe 
        width="100%"
        height="720px"  
        src= {LOOKER_URL}
      />
    </div>

export default Chart;
