package cn.iocoder.yudao.module.infra.service.education;

import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;

@Service
public class EducationService {
 private final JdbcTemplate db;
 public EducationService(JdbcTemplate db){this.db=db;}
 public record Course(@NotBlank @Pattern(regexp="[a-z0-9-]{1,40}") String id,
   @NotBlank @Size(max=80) String title, @NotBlank @Size(max=600) String description,
   @Min(1) @Max(3) int stage, @NotBlank @Size(max=40) @Pattern(regexp="minecraft|museum|notes") String image,
   @Size(max=2000) String outline, boolean published, @Min(0) @Max(999) int sortOrder) {}
 public record Inquiry(@NotBlank @Size(max=40) String name,
   @NotBlank @Pattern(regexp="(1[3-9][0-9]{9}|[^\\s@]+@[^\\s@]+\\.[^\\s@]+)") @Size(max=120) String contact,
   @NotBlank @Size(max=80) String experience, @NotBlank @Size(max=80) String interest,
   @Size(max=1000) String message, @AssertTrue boolean consent,
   @NotBlank @Pattern(regexp="[a-zA-Z0-9-]{16,64}") String requestId) {}
 public record FollowUp(@NotBlank @Pattern(regexp="new|contacted|closed") String status,@Size(max=2000) String note) {}
 @PostConstruct public void initialize(){
  db.execute("CREATE TABLE IF NOT EXISTS edu_course (id VARCHAR(40) PRIMARY KEY,title VARCHAR(80) NOT NULL,description VARCHAR(600) NOT NULL,stage INT NOT NULL,image VARCHAR(40) NOT NULL,outline TEXT,published BOOLEAN NOT NULL DEFAULT 0,sort_order INT NOT NULL DEFAULT 0,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) CHARACTER SET utf8mb4");
  db.execute("CREATE TABLE IF NOT EXISTS edu_inquiry (id VARCHAR(36) PRIMARY KEY,request_id VARCHAR(64) UNIQUE NOT NULL,name VARCHAR(40) NOT NULL,contact VARCHAR(120) NOT NULL,experience VARCHAR(80) NOT NULL,interest VARCHAR(80) NOT NULL,message TEXT,status VARCHAR(20) NOT NULL DEFAULT 'new',note TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) CHARACTER SET utf8mb4");
 }
 public List<Map<String,Object>> courses(boolean all){
  return db.queryForList("SELECT id,title,description,stage,image,outline,published,sort_order AS sortOrder FROM edu_course "+(all?"":"WHERE published=1 ")+"ORDER BY sort_order,id");
 }
 @Transactional public void save(Course c){
  db.update("INSERT INTO edu_course(id,title,description,stage,image,outline,published,sort_order) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),stage=VALUES(stage),image=VALUES(image),outline=VALUES(outline),published=VALUES(published),sort_order=VALUES(sort_order)",c.id(),c.title(),c.description(),c.stage(),c.image(),c.outline(),c.published(),c.sortOrder());
 }
 @Transactional public Map<String,String> submit(Inquiry i){
  String id=UUID.randomUUID().toString();
  int added=db.update("INSERT IGNORE INTO edu_inquiry(id,request_id,name,contact,experience,interest,message) VALUES(?,?,?,?,?,?,?)",id,i.requestId(),i.name().trim(),i.contact().trim(),i.experience(),i.interest(),i.message());
  // Do not return existing personal data when a duplicate request token is supplied.
  return Map.of("receipt",added==1?id:"already-received");
 }
 public List<Map<String,Object>> inquiries(){
  return db.queryForList("SELECT id,name,contact,experience,interest,message,status,note,created_at AS createdAt,updated_at AS updatedAt FROM edu_inquiry ORDER BY created_at DESC LIMIT 500");
 }
 public void follow(String id,FollowUp f){
  if(db.update("UPDATE edu_inquiry SET status=?,note=? WHERE id=?",f.status(),f.note(),id)==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND);
 }
}
