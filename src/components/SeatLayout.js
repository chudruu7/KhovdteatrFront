export const ROW_CELLS = [
  { label: '1-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '2-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '3-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '4-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '0-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '5-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '6-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '7-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '8-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '9-р эгнээ',  left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { label: '10-р эгнээ', left: [22,21,20,19,18,17,16,15,14,13,12].map(num=>({num})), right: [11,10,9,8,7,6,5,4,3,2,1].map(num=>({num})) },
  { 
    label: '11-р эгнээ', 
    left:  [22,21,20,19,18,17,16,15,14,13,12].map(num => ({ num })), 
    right: [
      {num:11},{num:10},{num:9},{num:8},{num:7},
      {num:6},{num:5},{num:4},{num:3},{num:2},
      {num:1, broken:true}
    ]
  },
  {
    label: '12-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:11},{num:10},{num:9},{num:8},{num:7},{num:6},{num:5},
      {num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },
  {
    label: '13-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:13},{num:12},{num:11},{num:10},{num:9},{num:8},{num:7},
      {num:6,broken:true},
      {num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},
      {num:5,broken:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },
  {
    label: '14-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:12},{num:11},{num:10},{num:9},{num:8},{num:7},{num:6},
      {num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},
      {num:5,broken:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },
  {
    label: '15-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:11},{num:10},{num:9},{num:8},{num:7},{num:6},
      {num:5,broken:true},
      {num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:4},{num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },
  {
    label: '16-р эгнээ',
    left:  [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:9},{num:8},{num:7},{num:6},{num:5},{num:4},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
    right: [
      {num:null,phantom:true},{num:null,phantom:true},
      {num:3},{num:2},{num:1},
      {num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},{num:null,phantom:true},
    ],
  },
];

export function makeSeatId(rowLabel, num) {
  return `${rowLabel.replace('-р эгнээ', 'эг')}-${num}`;
}
