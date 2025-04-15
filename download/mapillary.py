# pip install osmnx

import osmnx as ox
import requests
import pandas as pd
import pdb
import os
import tqdm
import glob

MAPILLARY_ACCESS_TOKEN=""

def mySort(path):
  ## data/images_1-1000.csv
  path = os.path.basename(path)
  name = path.split(".")[0]
  _, name_range = name.split("_")
  start, _ = name_range.split("-")
  return int(start)

# https://gdsl-ul.github.io/wma/labs/w07_OSM.html
def get_graph(place):
  G = ox.graph_from_place(place, network_type='drive')
  nodes, _ = ox.graph_to_gdfs(G)

  return nodes

# https://www.mapillary.com/developer/api-documentation
def download_node_images(nodes, output_path):
  # pdb.set_trace()
  endpoint = "https://graph.mapillary.com"
  access_token = "access_token=" + MAPILLARY_ACCESS_TOKEN
  dist = 0.00005
  saved_images = []

  for idx, (_, row) in enumerate(nodes.iterrows(), 1):
    print("|- Processing node {}/{}: lat {} long {}".format(idx, nodes.shape[0], row.y, row.x))
    bbox =  "bbox={},{},{},{}".format(row.x - dist, row.y - dist, row.x + dist, row.y + dist)
    url = endpoint + "/images" + "?" + access_token + "&" + bbox
    response = requests.get(url)

    if response.status_code == 200:
      images = response.json()["data"]

      if len(images) == 0:
        print("WARNING: no image found")

      for jdx, img in enumerate(images, 1):
        print("|-- image {}/{}".format(jdx, len(images)))
        url = endpoint + "/" + img["id"] + "?" + access_token + "&" + "fields=thumb_2048_url" ##thumb_original_url, thumb_2048_url, thumb_1024_url, thumb_256_url
        response = requests.get(url)
        # continue
      
        if response.status_code == 200:
          img_url = response.json()["thumb_2048_url"]
          response = requests.get(img_url)

          if response.status_code == 200:
            with open(os.path.join(output_path, img["id"] + ".jpg"), "wb") as file:
                file.write(response.content)

            new_row = pd.concat([row, pd.Series({"node_id": idx, "img_id": img["id"], "img_coordinates": img["geometry"]["coordinates"]})])
            saved_images.append(new_row)
          else:
            print("WARNING: download image id {}".format(img["id"]), "- status", response.status_code)
        else:
          print("WARNING: read image id {}".format(img["id"]), "- status", response.status_code)

        # break        
    else:
      print("WARNING: read {}".format(bbox), "- status", response.status_code)

    # break

  # pdb.set_trace()
  saved_images = pd.DataFrame(saved_images)
  saved_images.to_csv(os.path.join(output_path, "images.csv"), index = False)

  print("Processed {} nodes - dowloaded {} images from {} nodes".format(nodes.shape[0], saved_images.img_id.unique().shape[0], saved_images.node_id.unique().shape[0]))

def download_data_images(data, output_path, total, file_desc = "", first_id = 0):
  endpoint = "https://graph.mapillary.com"
  access_token = "access_token=" + MAPILLARY_ACCESS_TOKEN
  dist = 0.00005
  saved_images = []
  id = first_id

  for idx, (_, row) in enumerate(data.iterrows(), 1):
    id = id + 1
    latitude  = row.latitude if "latitude" in data.columns else row.y
    longitude = row.longitude if "longitude" in data.columns else row.x

    print("|- Processing {}/{} ({}/{}): lat {} long {}".format(idx, data.shape[0], id, total, latitude, longitude))

    bbox =  "bbox={},{},{},{}".format(longitude - dist, latitude - dist, longitude + dist, latitude + dist)
    url = endpoint + "/images" + "?" + access_token + "&" + bbox
    response = requests.get(url)

    if response.status_code == 200:
      images = response.json()["data"]

      if len(images) == 0:
        print("WARNING: no image found")

      for jdx, img in enumerate(images, 1):  
        # pdb.set_trace()
        print("|-- image {}/{}".format(jdx, len(images)))
        url = endpoint + "/" + img["id"] + "?" + access_token + "&" + "fields=thumb_2048_url" ##thumb_original_url, thumb_2048_url, thumb_1024_url, thumb_256_url
        response = requests.get(url)

        if response.status_code == 200:
          img_url = response.json()["thumb_2048_url"]
          response = requests.get(img_url)

          if response.status_code == 200:
            row_id = str(row.ID) if "ID" in data.columns else str(id)

            with open(os.path.join(output_path, row_id + "_" + img["id"] + ".jpg"), "wb") as file:
              file.write(response.content)

            # pdb.set_trace()
            if "ID" in data.columns:
              new_row = pd.concat([row, pd.Series({"img_id": img["id"], "img_coordinates": img["geometry"]["coordinates"]})])
            else:
              new_row = pd.concat([row, pd.Series({"row_id": row_id, "img_id": img["id"], "img_coordinates": img["geometry"]["coordinates"]})])  

            saved_images.append(new_row)
          else:
            print("WARNING: download image id {}".format(img["id"]), "- status", response.status_code)
        else:
          print("WARNING: read image id {}".format(img["id"]), "- status", response.status_code)
    else:
      print("WARNING: read {}".format(bbox), "- status", response.status_code)        
    
  saved_images = pd.DataFrame(saved_images)
  saved_images.to_csv(os.path.join(output_path, "images{}.csv".format(file_desc)), index = False)

  row_id = "ID" if "ID" in data.columns else "row_id"
  log_msg = "Processed {} rows - dowloaded {} images from {} rows".format(data.shape[0], saved_images.img_id.unique().shape[0], saved_images[row_id].unique().shape[0])

  with open("batch_log.txt", "a") as file:
    file.write(file_desc + " " + log_msg + "\n")

  print(log_msg)    

#=====================DOWNLOAD IMAGES FROM AN OSMNX GRAPH====================================#
## Processed 77 nodes - dowloaded 241 images from 51 nodes
## OSMnx graph: y	x	highway	street_count	geometry	
## Mapillary images: img_id	img_coordinates
#
#nodes = get_graph("Downtown, Brooklyn, New York")
#download_node_images(nodes, "data")

#====================DOWNLOAD IMAGES FROM BROOKLYN====================================#
## Processed 543 rows of the csv - dowloaded 1751 images from 293 rows
#
# data = pd.read_csv("Brooklyn_updated_test_Motor_Vehicle_Collisions_Crashes.csv")
# download_data_images(data, "data")

#===================DOWNLOAD IMAGES FROM NEW YORK======================================#
## Processed 55252 rows of the csv - dowloaded 126915 images from 19203 rows
#
# data = pd.read_csv("NewYork_interceptions_info.csv")
# batch_size = 1000
# nr_batch = data.shape[0] // batch_size
# nr_batch = nr_batch if nr_batch * batch_size == data.shape[0] else nr_batch + 1

# for first_idx in tqdm.tqdm(range(0, data.shape[0], batch_size), desc = "Batch" , total = nr_batch, unit= "step"):  
#   batch = data.iloc[first_idx:(first_idx + batch_size)]
#   desc = "_{}-{}".format(first_idx + 1, first_idx + batch_size)

#   download_data_images(batch, "data", data.shape[0], desc, first_idx)

# #Join output csv files
# files = glob.glob("data/*csv")
# files.sort(key = mySort)
# all_csv = pd.DataFrame()

# for fl in files:
#   csv = pd.read_csv(fl)
#   all_csv = pd.concat([all_csv, csv])

# all_csv.to_csv("images_1-{}.csv".format(data.shape[0]), index = False)
#=========================================================#
